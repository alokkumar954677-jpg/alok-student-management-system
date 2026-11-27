import { useEffect, useState, type FormEvent } from 'react';
import { Save, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import type { NavSection, Student } from '../types/student';

interface UpdateStudentViewProps {
  students: Student[];
  selectedRollNo: number | null;
  onSelectRollNo: (rollNo: number | null) => void;
  onNavigate: (section: NavSection) => void;
  onUpdateStudent: (
    originalRollNo: number,
    payload: { roll_no: number; name: string; age: number }
  ) => Promise<{ ok: boolean; error?: string; message?: string; student?: Student }>;
}

export function UpdateStudentView({
  students,
  selectedRollNo,
  onSelectRollNo,
  onNavigate,
  onUpdateStudent,
}: UpdateStudentViewProps) {
  const sortedStudents = [...students].sort((a, b) => a.roll_no - b.roll_no);

  const activeStudent =
    sortedStudents.find((s) => s.roll_no === selectedRollNo) ??
    sortedStudents[0] ??
    null;

  const [newRoll, setNewRoll] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newAge, setNewAge] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeStudent) {
      setNewRoll(String(activeStudent.roll_no));
      setNewName(activeStudent.name);
      setNewAge(String(activeStudent.age));
      setError(null);
    }
  }, [activeStudent?.roll_no, activeStudent?.name, activeStudent?.age]);

  if (sortedStudents.length === 0 || !activeStudent) {
    return (
      <section className="rounded-xl bg-white border border-slate-200 shadow-xs px-6 py-14 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          No students available to update
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Add a student record first before editing student information.
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

  const parsedNewRoll = Number(newRoll);
  const hasConflict =
    Number.isInteger(parsedNewRoll) &&
    parsedNewRoll !== activeStudent.roll_no &&
    students.some((s) => s.roll_no === parsedNewRoll);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const rollNum = Number(newRoll);
    const ageNum = Number(newAge);
    const cleanName = newName.trim();

    if (!Number.isInteger(rollNum) || rollNum <= 0) {
      setError('Roll Number must be a positive whole number.');
      return;
    }
    if (hasConflict) {
      setError(
        `Roll Number #${rollNum} already belongs to another student.`
      );
      return;
    }
    if (!cleanName) {
      setError('Student Name cannot be empty.');
      return;
    }
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      setError('Student Age must be between 1 and 120.');
      return;
    }

    setSaving(true);
    const result = await onUpdateStudent(activeStudent.roll_no, {
      roll_no: rollNum,
      name: cleanName,
      age: ageNum,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? 'Failed to update student record.');
      return;
    }

    if (result.student) {
      onSelectRollNo(result.student.roll_no);
    }
    setSuccess(result.message ?? 'Student record updated successfully.');
  };

  return (
    <section className="max-w-3xl rounded-xl bg-white border border-slate-200 shadow-xs p-6">
      <div className="pb-5 border-b border-slate-200">
        <h2 className="text-base font-semibold text-[#062C24]">
          Update Student Information
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select an existing student record to modify Roll Number, Name, or Age.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label
            htmlFor="update-student-select"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Select Student
          </label>
          <select
            id="update-student-select"
            value={activeStudent.roll_no}
            onChange={(e) => {
              onSelectRollNo(Number(e.target.value));
              setSuccess(null);
              setError(null);
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

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="edit-roll-no"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Roll Number
            </label>
            <input
              id="edit-roll-no"
              type="number"
              min={1}
              step={1}
              value={newRoll}
              onChange={(e) => {
                setNewRoll(e.target.value);
                setError(null);
              }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                hasConflict
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-slate-300 focus:border-[#0D6B58] focus:ring-emerald-100'
              }`}
              required
            />
            {hasConflict && (
              <p className="mt-1.5 text-xs text-red-600">
                Roll Number #{parsedNewRoll} is already taken.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-age"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Age
            </label>
            <input
              id="edit-age"
              type="number"
              min={1}
              max={120}
              step={1}
              value={newAge}
              onChange={(e) => {
                setNewAge(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white focus:border-[#0D6B58] focus:outline-none focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-name"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Student Name
          </label>
          <input
            id="edit-name"
            type="text"
            maxLength={120}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0D6B58] focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setNewRoll(String(activeStudent.roll_no));
              setNewName(activeStudent.name);
              setNewAge(String(activeStudent.age));
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Revert Changes
          </button>
          <button
            type="submit"
            disabled={saving || hasConflict}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D6B58] text-sm font-semibold text-white hover:bg-[#0A5344] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Updating...' : 'Save Updated Information'}
          </button>
        </div>
      </form>
    </section>
  );
}
