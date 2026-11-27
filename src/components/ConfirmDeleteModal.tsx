import { AlertTriangle, X } from 'lucide-react';
import type { Student } from '../types/student';

interface ConfirmDeleteModalProps {
  student: Student | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (rollNo: number) => void;
}

export function ConfirmDeleteModal({
  student,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!student) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <h2
              id="confirm-delete-title"
              className="text-base font-semibold text-slate-900"
            >
              Confirm Student Deletion
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-700"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently remove this student record from the database? This action cannot be undone.
          </p>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Roll Number</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                #{student.roll_no}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Student Name</span>
              <span className="font-medium text-slate-900">{student.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Age</span>
              <span className="font-mono tabular-nums text-slate-900">
                {student.age} years
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(student.roll_no)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {isDeleting ? 'Deleting...' : 'Delete Student'}
          </button>
        </div>
      </div>
    </div>
  );
}
