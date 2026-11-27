import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface StudentRecord {
  roll_no: number;
  name: string;
  age: number;
  created_at: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  averageAge: number | null;
  youngestStudent: StudentRecord | null;
  recentStudents: StudentRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'students.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS students (
      roll_no INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL CHECK(age > 0 AND age <= 120),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const seededRow = db
    .prepare('SELECT value FROM app_meta WHERE key = ?')
    .get('initial_seed_v1') as { value: string } | undefined;

  if (!seededRow) {
    const existingCount = db
      .prepare('SELECT COUNT(*) AS count FROM students')
      .get() as { count: number };

    if (existingCount.count === 0) {
      const insertStmt = db.prepare(
        'INSERT INTO students (roll_no, name, age, created_at) VALUES (?, ?, ?, ?)'
      );
      const initialStudents: Array<[number, string, number, string]> = [
        [101, 'Aarav Sharma', 19, '2026-11-22 09:15:00'],
        [102, 'Priya Patel', 20, '2026-11-23 10:30:00'],
        [103, 'Rohan Verma', 18, '2026-11-24 11:45:00'],
        [104, 'Ananya Iyer', 21, '2026-11-25 14:20:00'],
        [105, 'Kabir Nair', 19, '2026-11-26 16:05:00'],
      ];
      for (const row of initialStudents) {
        insertStmt.run(row[0], row[1], row[2], row[3]);
      }
    }

    db.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run(
      'initial_seed_v1',
      'done'
    );
  }

  dbInstance = db;
  return db;
}

export function listStudents(query?: string, searchBy: 'both' | 'roll' | 'name' = 'both'): StudentRecord[] {
  const db = getDb();
  const trimmed = (query ?? '').trim();

  if (!trimmed) {
    return db
      .prepare('SELECT roll_no, name, age, created_at FROM students ORDER BY created_at DESC, roll_no ASC')
      .all() as unknown as StudentRecord[];
  }

  if (searchBy === 'roll') {
    if (!/^\d+$/.test(trimmed)) {
      return [];
    }
    return db
      .prepare(
        'SELECT roll_no, name, age, created_at FROM students WHERE roll_no = ? OR CAST(roll_no AS TEXT) LIKE ? ORDER BY roll_no ASC'
      )
      .all(Number(trimmed), `${trimmed}%`) as unknown as StudentRecord[];
  }

  if (searchBy === 'name') {
    return db
      .prepare(
        'SELECT roll_no, name, age, created_at FROM students WHERE LOWER(name) LIKE LOWER(?) ORDER BY roll_no ASC'
      )
      .all(`%${trimmed}%`) as unknown as StudentRecord[];
  }

  if (/^\d+$/.test(trimmed)) {
    return db
      .prepare(
        'SELECT roll_no, name, age, created_at FROM students WHERE roll_no = ? OR CAST(roll_no AS TEXT) LIKE ? OR LOWER(name) LIKE LOWER(?) ORDER BY roll_no ASC'
      )
      .all(Number(trimmed), `${trimmed}%`, `%${trimmed}%`) as unknown as StudentRecord[];
  }

  return db
    .prepare(
      'SELECT roll_no, name, age, created_at FROM students WHERE LOWER(name) LIKE LOWER(?) ORDER BY roll_no ASC'
    )
    .all(`%${trimmed}%`) as unknown as StudentRecord[];
}

export function getDashboardMetrics(): DashboardMetrics {
  const db = getDb();
  const all = db
    .prepare('SELECT roll_no, name, age, created_at FROM students ORDER BY created_at DESC, roll_no ASC')
    .all() as unknown as StudentRecord[];

  if (all.length === 0) {
    return {
      totalStudents: 0,
      averageAge: null,
      youngestStudent: null,
      recentStudents: [],
    };
  }

  const totalStudents = all.length;
  const ageSum = all.reduce((sum, s) => sum + Number(s.age), 0);
  const averageAge = Number((ageSum / totalStudents).toFixed(1));
  const youngestStudent = all.reduce((youngest, current) =>
    current.age < youngest.age ? current : youngest
  );

  return {
    totalStudents,
    averageAge,
    youngestStudent,
    recentStudents: all.slice(0, 5),
  };
}

export function createStudent(rollNo: number, name: string, age: number): { ok: true; student: StudentRecord } | { ok: false; status: number; error: string } {
  const db = getDb();
  const existing = db
    .prepare('SELECT roll_no FROM students WHERE roll_no = ?')
    .get(rollNo) as { roll_no: number } | undefined;

  if (existing) {
    return {
      ok: false,
      status: 409,
      error: `Roll Number ${rollNo} already exists. Please enter a unique Roll Number.`,
    };
  }

  db.prepare('INSERT INTO students (roll_no, name, age) VALUES (?, ?, ?)').run(rollNo, name, age);
  const created = db
    .prepare('SELECT roll_no, name, age, created_at FROM students WHERE roll_no = ?')
    .get(rollNo) as unknown as StudentRecord;

  return { ok: true, student: created };
}

export function updateStudentRecord(
  originalRollNo: number,
  newRollNo: number,
  newName: string,
  newAge: number
): { ok: true; student: StudentRecord } | { ok: false; status: number; error: string } {
  const db = getDb();
  const target = db
    .prepare('SELECT roll_no FROM students WHERE roll_no = ?')
    .get(originalRollNo) as { roll_no: number } | undefined;

  if (!target) {
    return {
      ok: false,
      status: 404,
      error: `Student with Roll Number ${originalRollNo} was not found.`,
    };
  }

  if (newRollNo !== originalRollNo) {
    const conflict = db
      .prepare('SELECT roll_no FROM students WHERE roll_no = ?')
      .get(newRollNo) as { roll_no: number } | undefined;

    if (conflict) {
      return {
        ok: false,
        status: 409,
        error: `Cannot change to Roll Number ${newRollNo} because it is already assigned to another student.`,
      };
    }
  }

  db.prepare('UPDATE students SET roll_no = ?, name = ?, age = ? WHERE roll_no = ?').run(
    newRollNo,
    newName,
    newAge,
    originalRollNo
  );

  const updated = db
    .prepare('SELECT roll_no, name, age, created_at FROM students WHERE roll_no = ?')
    .get(newRollNo) as unknown as StudentRecord;

  return { ok: true, student: updated };
}

export function deleteStudentRecord(rollNo: number): { ok: true } | { ok: false; status: number; error: string } {
  const db = getDb();
  const result = db.prepare('DELETE FROM students WHERE roll_no = ?').run(rollNo);
  if (result.changes === 0) {
    return {
      ok: false,
      status: 404,
      error: `Student with Roll Number ${rollNo} was not found.`,
    };
  }
  return { ok: true };
}
