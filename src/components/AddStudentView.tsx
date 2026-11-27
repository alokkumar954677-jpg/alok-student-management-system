import { useState, type FormEvent } from 'react';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Student } from '../types/student';

interface AddStudentViewProps {
  existingStudents: Student[];
  onAddStudent: (payload: {
    roll_no: number;
    name: string;
    age: number;
  }) => Promise<{ ok: boolean; error?: string; message?: string }>;
}

export function AddStudentView({
  existingStudents,
  onAddStudent,
}: AddStudentViewProps) {
  const suggestedRoll =
    existingStudents.length > 0
      ? Math.max(...existingStudents.map((s) => s.roll_no)) + 1
      : 101;

  const [rollNo, setRollNo] = useState<string>(String(suggestedRoll));
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('19');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const parsedRoll = Number(rollNo);
  const isDuplicateRoll =
    Number.isInteger(parsedRoll) &&
    parsedRoll > 0 &&
    existingStudents.some((s) => s.roll_no === parsedRoll);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const rollNum = Number(rollNo);
    const ageNum = Number(age);
    const cleanName = name.trim();

    if (!Number.isInteger(rollNum) || rollNum <= 0) {
      setFormError('Roll Number must be a positive whole number.');
      return;
    }
    if (isDuplicateRoll) {
      setFormError(
        `Roll Number #${rollNum} is already assigned to another student.`
      );
      return;
    }
    if (!cleanName) {
      setFormError('Student Name is required.');
      return;
    }
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      setFormError('Student Age must be a whole number between 1 and 120.');
      return;
    }

    setSubmitting(true);
    const result = await onAddStudent({
      roll_no: rollNum,
      name: cleanName,
      age: ageNum,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error ?? 'Failed to save student record.');
      return;
    }

    setFormSuccess(result.message ?? 'Student added successfully.');
    setName('');
    setRollNo(String(rollNum + 1));
    setAge('19');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Add Form */}
      <section className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-xs p-6">
        <div className="pb-5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-[#062C24]">
            Register New Student
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter a unique Roll Number, full name, and age. Duplicate Roll Numbers are rejected automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="add-roll-no"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Student Roll Number
              </label>
              <input
                id="add-roll-no"
                type="number"
                min={1}
                step={1}
                value={rollNo}
                onChange={(e) => {
                  setRollNo(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g., 106"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                  isDuplicateRoll
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-slate-300 focus:border-[#0D6B58] focus:ring-emerald-100'
                }`}
                required
              />
              {isDuplicateRoll ? (
                <p className="mt-1.5 text-xs text-red-600">
                  Roll Number #{parsedRoll} already exists.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Must be a unique positive integer
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="add-age"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Student Age
              </label>
              <input
                id="add-age"
                type="number"
                min={1}
                max={120}
                step={1}
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g., 19"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white focus:outline-none focus:border-[#0D6B58] focus:ring-2 focus:ring-emerald-100"
                required
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Valid range: 1 to 120 years
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="add-name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Student Name
            </label>
            <input
              id="add-name"
              type="text"
              maxLength={120}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError(null);
              }}
              placeholder="e.g., Meera Krishnan"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0D6B58] focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setName('');
                setAge('19');
                setRollNo(String(suggestedRoll));
                setFormError(null);
                setFormSuccess(null);
              }}
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting || isDuplicateRoll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D6B58] text-sm font-semibold text-white hover:bg-[#0A5344] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </section>

      {/* Recent Additions Panel */}
      <aside className="rounded-xl bg-white border border-slate-200 shadow-xs p-6">
        <h3 className="text-sm font-semibold text-[#062C24]">
          Recently Saved
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Latest records persisted in SQLite
        </p>

        {existingStudents.length === 0 ? (
          <p className="mt-5 text-xs text-slate-500">
            No students saved yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {existingStudents.slice(0, 5).map((s) => (
              <li
                key={s.roll_no}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                    Roll #{s.roll_no}
                  </div>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-600 shrink-0">
                  {s.age} yrs
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
