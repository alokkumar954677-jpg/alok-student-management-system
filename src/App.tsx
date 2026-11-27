import { useCallback, useEffect, useState } from 'react';
import {
  Menu,
  FileSpreadsheet,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AddStudentView } from './components/AddStudentView';
import { StudentsDirectoryView } from './components/StudentsDirectoryView';
import { UpdateStudentView } from './components/UpdateStudentView';
import { DeleteStudentView } from './components/DeleteStudentView';
import { PythonDeliverablesView } from './components/PythonDeliverablesView';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import type {
  DashboardMetrics,
  NavSection,
  Student,
  ToastNotice,
} from './types/student';

const SECTION_META: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of student enrollment, age metrics, and recent records.',
  },
  add: {
    title: 'Add Student',
    subtitle: 'Create a new student record with duplicate roll number validation.',
  },
  view: {
    title: 'View & Search Students',
    subtitle: 'Browse, sort, search by Roll Number or Name, and export to Excel.',
  },
  update: {
    title: 'Update Student',
    subtitle: 'Edit Roll Number, Name, or Age for an existing student.',
  },
  delete: {
    title: 'Delete Student',
    subtitle: 'Permanently remove a student record after confirmation.',
  },
  python: {
    title: 'Python & Deploy Guide',
    subtitle: 'Complete Python + Streamlit + Pandas + SQLite source files and setup instructions.',
  },
};

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    averageAge: null,
    youngestStudent: null,
    recentStudents: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [editRollNo, setEditRollNo] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isModalDeleting, setIsModalDeleting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const pushToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch student records.');
      }
      const data = await response.json();
      setStudents(Array.isArray(data.students) ? data.students : []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error(error);
      pushToast('error', 'Unable to load student records from the server.');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (payload: {
    roll_no: number;
    name: string;
    age: number;
  }) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast('error', data.error ?? 'Failed to add student.');
        return { ok: false, error: data.error };
      }
      await fetchStudents();
      pushToast('success', data.message ?? 'Student added successfully.');
      return { ok: true, message: data.message };
    } catch {
      const errMsg = 'Network error while saving student record.';
      pushToast('error', errMsg);
      return { ok: false, error: errMsg };
    }
  };

  const handleUpdateStudent = async (
    originalRollNo: number,
    payload: { roll_no: number; name: string; age: number }
  ) => {
    try {
      const res = await fetch(`/api/students/${originalRollNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast('error', data.error ?? 'Failed to update student.');
        return { ok: false, error: data.error };
      }
      await fetchStudents();
      pushToast('success', data.message ?? 'Student record updated.');
      return { ok: true, message: data.message, student: data.student };
    } catch {
      const errMsg = 'Network error while updating student record.';
      pushToast('error', errMsg);
      return { ok: false, error: errMsg };
    }
  };

  const handleDeleteStudent = async (rollNo: number) => {
    try {
      const res = await fetch(`/api/students/${rollNo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast('error', data.error ?? 'Failed to delete student.');
        return { ok: false, error: data.error };
      }
      await fetchStudents();
      pushToast('success', data.message ?? 'Student deleted successfully.');
      return { ok: true };
    } catch {
      const errMsg = 'Network error while deleting student record.';
      pushToast('error', errMsg);
      return { ok: false, error: errMsg };
    }
  };

  const handleConfirmModalDelete = async (rollNo: number) => {
    setIsModalDeleting(true);
    const result = await handleDeleteStudent(rollNo);
    setIsModalDeleting(false);
    if (result.ok) {
      setDeleteTarget(null);
    }
  };

  const handleEditFromRow = (student: Student) => {
    setEditRollNo(student.roll_no);
    setActiveSection('update');
  };

  const handleExportExcel = async () => {
    if (students.length === 0) {
      pushToast('error', 'There are no student records to export.');
      return;
    }
    if (exporting) return;

    try {
      setExporting(true);
      const response = await fetch('/api/students/export-excel');
      if (!response.ok) {
        throw new Error('Failed to generate Excel workbook.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students_records.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      pushToast('success', 'Downloaded formatted Excel table (students_records.xlsx).');
    } catch (error) {
      console.error(error);
      pushToast('error', 'Failed to export Excel table.');
    } finally {
      setExporting(false);
    }
  };

  const meta = SECTION_META[activeSection];

  return (
    <div className="min-h-screen flex bg-[#F7FAF9] text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        totalStudents={students.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus-visible:outline-2 focus-visible:outline-emerald-700"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-sm min-w-0 truncate">
                <span className="font-medium text-slate-500 hidden sm:inline">
                  Student Manager
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-[#062C24] truncate">
                  {meta.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {students.length > 0 && activeSection !== 'python' && (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D6B58]" />
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
              )}

              {activeSection !== 'add' && (
                <button
                  type="button"
                  onClick={() => setActiveSection('add')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0D6B58] text-xs font-semibold text-white hover:bg-[#0A5344] transition-colors whitespace-nowrap shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Student
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-7">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#062C24] text-balance">
                {meta.title}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{meta.subtitle}</p>
            </div>

            {activeSection === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                allStudents={students}
                loading={loading}
                onNavigate={setActiveSection}
                onEditStudent={handleEditFromRow}
                onRequestDelete={setDeleteTarget}
                onExportExcel={handleExportExcel}
              />
            )}

            {activeSection === 'add' && (
              <AddStudentView
                existingStudents={students}
                onAddStudent={handleAddStudent}
              />
            )}

            {activeSection === 'view' && (
              <StudentsDirectoryView
                students={students}
                loading={loading}
                onNavigate={setActiveSection}
                onEditStudent={handleEditFromRow}
                onRequestDelete={setDeleteTarget}
                onExportExcel={handleExportExcel}
              />
            )}

            {activeSection === 'update' && (
              <UpdateStudentView
                students={students}
                selectedRollNo={editRollNo}
                onSelectRollNo={setEditRollNo}
                onNavigate={setActiveSection}
                onUpdateStudent={handleUpdateStudent}
              />
            )}

            {activeSection === 'delete' && (
              <DeleteStudentView
                students={students}
                onNavigate={setActiveSection}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {activeSection === 'python' && <PythonDeliverablesView />}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        student={deleteTarget}
        isDeleting={isModalDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmModalDelete}
      />

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-md text-sm ${
                toast.type === 'success'
                  ? 'bg-white border-emerald-200 text-slate-900'
                  : 'bg-white border-red-200 text-slate-900'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <span className="flex-1 text-xs font-medium leading-relaxed">
                {toast.message}
              </span>
              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-slate-700 p-0.5"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
