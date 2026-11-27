import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import {
  createStudent,
  deleteStudentRecord,
  getDashboardMetrics,
  getDb,
  listStudents,
  updateStudentRecord,
} from './server/db.ts';

const PORT = 3000;
const PYTHON_DELIVERABLES_DIR = path.resolve(process.cwd(), 'python_streamlit');
const ALLOWED_DELIVERABLES = [
  { name: 'app.py', label: 'Streamlit App', language: 'python' },
  { name: 'database.py', label: 'SQLite Database', language: 'python' },
  { name: 'styles.css', label: 'Emerald & White CSS', language: 'css' },
  { name: 'requirements.txt', label: 'Dependencies', language: 'text' },
  { name: 'README.md', label: 'Setup & Deploy Guide', language: 'markdown' },
] as const;

function validateStudentInput(body: unknown):
  | { valid: true; roll_no: number; name: string; age: number }
  | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request payload.' };
  }

  const record = body as Record<string, unknown>;
  const rollRaw = Number(record.roll_no);
  const ageRaw = Number(record.age);
  const nameRaw = typeof record.name === 'string' ? record.name.trim() : '';

  if (!Number.isInteger(rollRaw) || rollRaw <= 0 || rollRaw > 999999999) {
    return { valid: false, error: 'Roll Number must be a positive whole number.' };
  }
  if (!nameRaw || nameRaw.length > 120) {
    return { valid: false, error: 'Student Name is required and must be 120 characters or fewer.' };
  }
  if (!Number.isInteger(ageRaw) || ageRaw < 1 || ageRaw > 120) {
    return { valid: false, error: 'Student Age must be a whole number between 1 and 120.' };
  }

  return { valid: true, roll_no: rollRaw, name: nameRaw, age: ageRaw };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  const safeStr = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }
  return safeStr;
}

async function startServer(): Promise<void> {
  // Ensure SQLite database and table exist on server boot
  getDb();

  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/students', (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const rawSearchBy = typeof req.query.searchBy === 'string' ? req.query.searchBy : 'both';
      const searchBy =
        rawSearchBy === 'roll' || rawSearchBy === 'name' ? rawSearchBy : 'both';

      const students = listStudents(q, searchBy);
      const metrics = getDashboardMetrics();
      res.json({ students, metrics });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Failed to load student records.' });
    }
  });

  app.post('/api/students', (req: Request, res: Response) => {
    try {
      const parsed = validateStudentInput(req.body);
      if (!parsed.valid) {
        res.status(400).json({ error: parsed.error });
        return;
      }

      const result = createStudent(parsed.roll_no, parsed.name, parsed.age);
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.status(201).json({
        student: result.student,
        message: `Student "${result.student.name}" (Roll #${result.student.roll_no}) added successfully.`,
      });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'Database error while adding student.' });
    }
  });

  app.put('/api/students/:rollNo', (req: Request, res: Response) => {
    try {
      const originalRollNo = Number(req.params.rollNo);
      if (!Number.isInteger(originalRollNo) || originalRollNo <= 0) {
        res.status(400).json({ error: 'Invalid original Roll Number.' });
        return;
      }

      const parsed = validateStudentInput(req.body);
      if (!parsed.valid) {
        res.status(400).json({ error: parsed.error });
        return;
      }

      const result = updateStudentRecord(
        originalRollNo,
        parsed.roll_no,
        parsed.name,
        parsed.age
      );
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.json({
        student: result.student,
        message: `Student record updated successfully (Roll #${result.student.roll_no}).`,
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ error: 'Database error while updating student.' });
    }
  });

  app.delete('/api/students/:rollNo', (req: Request, res: Response) => {
    try {
      const rollNo = Number(req.params.rollNo);
      if (!Number.isInteger(rollNo) || rollNo <= 0) {
        res.status(400).json({ error: 'Invalid Roll Number.' });
        return;
      }

      const result = deleteStudentRecord(rollNo);
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.json({ message: `Student with Roll #${rollNo} deleted successfully.` });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Database error while deleting student.' });
    }
  });

  app.get('/api/students/export', (_req: Request, res: Response) => {
    try {
      const students = listStudents();
      const header = ['Roll Number', 'Student Name', 'Age', 'Created At'].join(',');
      const rows = students.map((s) =>
        [
          escapeCsvCell(s.roll_no),
          escapeCsvCell(s.name),
          escapeCsvCell(s.age),
          escapeCsvCell(s.created_at),
        ].join(',')
      );
      const csv = '\uFEFF' + [header, ...rows].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: 'Failed to export student records to CSV.' });
    }
  });

  app.get('/api/students/export-excel', async (_req: Request, res: Response) => {
    try {
      const students = listStudents();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Student Management System';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Student Records', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = [
        { header: 'Roll Number', key: 'roll_no', width: 16 },
        { header: 'Student Name', key: 'name', width: 30 },
        { header: 'Age', key: 'age', width: 12 },
        { header: 'Recorded At', key: 'created_at', width: 24 },
      ];

      const safeRows = students.map((s) => {
        const safeName = /^[=+\-@\t\r]/.test(s.name) ? `'${s.name}` : s.name;
        return [s.roll_no, safeName, s.age, s.created_at];
      });

      for (const rowValues of safeRows) {
        sheet.addRow(rowValues);
      }

      sheet.autoFilter = 'A1:D1';

      const lastRow = sheet.rowCount;
      const lastCol = 4;

      const headerRow = sheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF062C24' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 || colNumber === 3 ? 'right' : 'left',
        };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF062C24' } },
          bottom: { style: 'medium', color: { argb: 'FF062C24' } },
          left: {
            style: colNumber === 1 ? 'medium' : 'thin',
            color: { argb: colNumber === 1 ? 'FF062C24' : 'FF1D5E4F' },
          },
          right: {
            style: colNumber === lastCol ? 'medium' : 'thin',
            color: { argb: colNumber === lastCol ? 'FF062C24' : 'FF1D5E4F' },
          },
        };
      });

      for (let r = 2; r <= lastRow; r += 1) {
        const row = sheet.getRow(r);
        row.height = 22;
        const isLastRow = r === lastRow;
        row.eachCell((cell, colNumber) => {
          cell.font = { color: { argb: 'FF0F172A' }, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' },
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 1 || colNumber === 3 ? 'right' : 'left',
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF64748B' } },
            bottom: {
              style: isLastRow ? 'medium' : 'thin',
              color: { argb: isLastRow ? 'FF062C24' : 'FF64748B' },
            },
            left: {
              style: colNumber === 1 ? 'medium' : 'thin',
              color: { argb: colNumber === 1 ? 'FF062C24' : 'FF64748B' },
            },
            right: {
              style: colNumber === lastCol ? 'medium' : 'thin',
              color: { argb: colNumber === lastCol ? 'FF062C24' : 'FF64748B' },
            },
          };
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="students_records.xlsx"'
      );
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error exporting Excel:', error);
      res.status(500).json({ error: 'Failed to export student records to Excel.' });
    }
  });

  app.get('/api/deliverables', (_req: Request, res: Response) => {
    try {
      const files = ALLOWED_DELIVERABLES.map((entry) => {
        const resolved = path.resolve(PYTHON_DELIVERABLES_DIR, entry.name);
        if (!resolved.startsWith(PYTHON_DELIVERABLES_DIR + path.sep)) {
          throw new Error('Invalid deliverable path');
        }
        const content = fs.existsSync(resolved) ? fs.readFileSync(resolved, 'utf-8') : '';
        return {
          name: entry.name,
          label: entry.label,
          language: entry.language,
          content,
        };
      });
      res.json({ files });
    } catch (error) {
      console.error('Error reading Python deliverables:', error);
      res.status(500).json({ error: 'Failed to read Python project files.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Management System running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
