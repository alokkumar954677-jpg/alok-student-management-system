import { useState } from 'react';
import { AlertTriangle, Trash2, Users } from 'lucide-react';
import type { NavSection, Student } from '../types/student';

interface DeleteStudentViewProps {
  students: Student[];
  onNavigate: (section: NavSection) => void;
  onDeleteStudent: (rollNo: number) => Promise<{ ok: boolean; error?: string }>;
}

export function DeleteStudentView({
  students,
  onNavigate,
  onDeleteStudent,
}: DeleteStudentViewProps) {
  const sortedStudents = [...students].sort((a, b) => a.roll_no - b.roll_no);
  const [selectedRoll, setSelectedRoll] = useState<number | null>(
    sortedStudents[0]?.roll_no ?? null
  );
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeStudent =
    sortedStudents.find((s) => s.roll_no === selectedRoll) ??
    sortedStudents[0] ??
    null;

  if (sortedStudents.length === 0 || !activeStudent) {
    return (
      <section className="rounded-xl bg-white border border-slate-200 shadow-xs px-6 py-14 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          No students available to delete
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          The student database is currently empty.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('add')}
          className="mt-4 px-4 py-2 rounded-lg bg-[#0D6B58] text-xs font-semibold text-white hover:bg-[#0A5344]"
        >
          Go to Add Student
        </button>
      </section>
    );
  }

  const handleDelete = async () => {
    if (!confirmed) return;
    setDeleting(true);
    const res = await onDeleteStudent(activeStudent.roll_no);
    setDeleting(false);
    if (res.ok) {
      setConfirmed(false);
      const remaining = sortedStudents.filter(
        (s) => s.roll_no !== activeStudent.roll_no
      );
      setSelectedRoll(remaining[0]?.roll_no ?? null);
    }
  };

  return (
    <section className="max-w-2xl rounded-xl bg-white border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <h2 className="text-base font-semibold text-[#062C24]">
          Delete Student Record
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select a student record and confirm deletion before removing it from SQLite.
        </p>
      </div>

      <div>
        <label
          htmlFor="delete-student-select"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Select Student
        </label>
        <select
          id="delete-student-select"
          value={activeStudent.roll_no}
          onChange={(e) => {
            setSelectedRoll(Number(e.target.value));
            setConfirmed(false);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D6B58] focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {sortedStudents.map((s) => (
            <option key={s.roll_no} value={s.roll_no}>
              Roll #{s.roll_no} — {s.name} (Age {s.age})
            </option>
          ))}
        </select>
      </div>

      {/* Record Preview */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Roll Number</span>
          <span className="font-mono font-semibold tabular-nums text-slate-900">
            #{activeStudent.roll_no}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Student Name</span>
          <span className="font-medium text-slate-900">{activeStudent.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Age</span>
          <span className="font-mono tabular-nums text-slate-900">
            {activeStudent.age} years
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Recorded At</span>
          <span className="font-mono text-xs tabular-nums text-slate-600">
            {activeStudent.created_at}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <span>
          Deleting this record will permanently remove {activeStudent.name} (Roll #{activeStudent.roll_no}) from the SQLite database.
        </span>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
        />
        <span>I confirm I want to permanently delete this student record.</span>
      </label>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!confirmed || deleting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete Student'}
        </button>
      </div>
    </section>
  );
}
