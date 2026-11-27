import {
  FileSpreadsheet,
  UserPlus,
  Pencil,
  Trash2,
  ArrowRight,
  Users,
} from 'lucide-react';
import type { DashboardMetrics, NavSection, Student } from '../types/student';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  allStudents: Student[];
  loading: boolean;
  onNavigate: (section: NavSection) => void;
  onEditStudent: (student: Student) => void;
  onRequestDelete: (student: Student) => void;
  onExportExcel: () => void;
}

export function DashboardView({
  metrics,
  allStudents,
  loading,
  onNavigate,
  onEditStudent,
  onRequestDelete,
  onExportExcel,
}: DashboardViewProps) {
  const youngest = metrics.youngestStudent;

  // Compute age brackets directly from SQLite records
  const brackets = [
    { label: 'Under 18', count: allStudents.filter((s) => s.age < 18).length },
    { label: '18 – 20', count: allStudents.filter((s) => s.age >= 18 && s.age <= 20).length },
    { label: '21 – 23', count: allStudents.filter((s) => s.age >= 21 && s.age <= 23).length },
    { label: '24+', count: allStudents.filter((s) => s.age >= 24).length },
  ];
  const maxBracket = Math.max(1, ...brackets.map((b) => b.count));

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section aria-label="Key Metrics" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-6">
          <div className="text-sm font-medium text-slate-500">Total Students</div>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#062C24]">
            {loading ? '—' : metrics.totalStudents}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Active records in SQLite database
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-6">
          <div className="text-sm font-medium text-slate-500">Average Student Age</div>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#062C24]">
            {loading ? '—' : metrics.averageAge !== null ? `${metrics.averageAge} yrs` : '—'}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Mean age across enrolled roster
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-6">
          <div className="text-sm font-medium text-slate-500">Youngest Student</div>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#062C24]">
            {loading ? '—' : youngest ? `${youngest.age} yrs` : '—'}
          </div>
          <div className="mt-2 text-xs text-slate-600 truncate">
            {youngest ? (
              <>
                <span>{youngest.name}</span>
                <span className="mx-1.5 text-slate-400" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Roll #{youngest.roll_no}</span>
              </>
            ) : (
              'No student records yet'
            )}
          </div>
        </div>
      </section>

      {/* Main Content Split: Recent Records Table + Age Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <section className="xl:col-span-2 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-[#062C24]">
                Recent Student Records
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest {metrics.recentStudents.length} entries ordered by registration time
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {allStudents.length > 0 && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D6B58]" />
                  Export Excel
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('add')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0D6B58] text-xs font-semibold text-white hover:bg-[#0A5344] transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Student
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-10 rounded-lg bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : metrics.recentStudents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                No student records found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Add your first student record to populate dashboard metrics and the student directory.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('add')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D6B58] text-xs font-semibold text-white hover:bg-[#0A5344] transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add First Student
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#062C24] text-xs font-semibold text-white">
                    <th className="py-3 px-5 border-b border-r border-emerald-800/80">Roll Number</th>
                    <th className="py-3 px-4 border-b border-r border-emerald-800/80">Student Name</th>
                    <th className="py-3 px-4 border-b border-r border-emerald-800/80 text-right">Age</th>
                    <th className="py-3 px-5 border-b border-emerald-950 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-sm">
                  {metrics.recentStudents.map((student) => (
                    <tr
                      key={student.roll_no}
                      className="bg-white hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-2.5 px-5 font-mono font-semibold tabular-nums text-slate-900 border-t border-r border-slate-300">
                        #{student.roll_no}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 border-t border-r border-slate-300">
                        {student.name}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 border-t border-r border-slate-300">
                        {student.age}
                      </td>
                      <td className="py-2.5 px-5 text-right border-t border-slate-300">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditStudent(student)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0D6B58] transition-colors"
                            aria-label={`Edit ${student.name}`}
                            title="Edit student"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(student)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label={`Delete ${student.name}`}
                            title="Delete student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {allStudents.length > 0 && (
            <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {metrics.recentStudents.length} of {allStudents.length} students
              </span>
              <button
                type="button"
                onClick={() => onNavigate('view')}
                className="inline-flex items-center gap-1 font-medium text-[#0D6B58] hover:underline whitespace-nowrap shrink-0"
              >
                View full directory
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Age Distribution Summary */}
        <section className="rounded-xl bg-white border border-slate-200 shadow-xs p-6">
          <h2 className="text-base font-semibold text-[#062C24]">
            Age Distribution
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of enrolled students by age group
          </p>

          <div className="mt-6 space-y-4">
            {brackets.map((bracket) => {
              const widthPercent =
                allStudents.length === 0
                  ? 0
                  : Math.round((bracket.count / maxBracket) * 100);
              return (
                <div key={bracket.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {bracket.label} yrs
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {bracket.count} {bracket.count === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0D6B58] transition-all duration-300"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
