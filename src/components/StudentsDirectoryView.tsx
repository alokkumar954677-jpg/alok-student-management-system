import { useMemo, useState } from 'react';
import {
  Search,
  FileSpreadsheet,
  Pencil,
  Trash2,
  UserPlus,
  X,
  ArrowUpDown,
} from 'lucide-react';
import type { NavSection, SearchByMode, Student } from '../types/student';

interface StudentsDirectoryViewProps {
  students: Student[];
  loading: boolean;
  onNavigate: (section: NavSection) => void;
  onEditStudent: (student: Student) => void;
  onRequestDelete: (student: Student) => void;
  onExportExcel: () => void;
}

type SortField = 'roll_no' | 'name' | 'age' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function StudentsDirectoryView({
  students,
  loading,
  onNavigate,
  onEditStudent,
  onRequestDelete,
  onExportExcel,
}: StudentsDirectoryViewProps) {
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState<SearchByMode>('both');
  const [sortField, setSortField] = useState<SortField>('roll_no');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const filteredAndSorted = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const filtered = !trimmed
      ? students
      : students.filter((s) => {
          const rollStr = String(s.roll_no);
          const nameStr = s.name.toLowerCase();
          if (searchBy === 'roll') {
            return rollStr === trimmed || rollStr.startsWith(trimmed);
          }
          if (searchBy === 'name') {
            return nameStr.includes(trimmed);
          }
          return (
            rollStr === trimmed ||
            rollStr.startsWith(trimmed) ||
            nameStr.includes(trimmed)
          );
        });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'roll_no') cmp = a.roll_no - b.roll_no;
      else if (sortField === 'age') cmp = a.age - b.age;
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [students, query, searchBy, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchBy === 'roll'
                    ? 'Search by Roll Number (e.g., 101)...'
                    : searchBy === 'name'
                    ? 'Search by Student Name...'
                    : 'Search by Roll Number or Name...'
                }
                aria-label="Search students"
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0D6B58] focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                  aria-label="Clear search query"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Interactive Segmented Control */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 shrink-0 self-start sm:self-auto"
              role="group"
              aria-label="Search filter mode"
            >
              {(
                [
                  { id: 'both', label: 'All Fields' },
                  { id: 'roll', label: 'Roll Number' },
                  { id: 'name', label: 'Student Name' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSearchBy(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    searchBy === tab.id
                      ? 'bg-white text-[#062C24] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {students.length > 0 && (
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
      </section>

      {/* Student Records Table */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-[#062C24]">
            Student Records
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredAndSorted.length} of {students.length} shown
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-10 rounded-lg bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-sm font-semibold text-slate-900">
              No student records in database
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Get started by adding your first student record.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('add')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D6B58] text-xs font-semibold text-white hover:bg-[#0A5344] transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Student
            </button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-sm font-semibold text-slate-900">
              No matching student records
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              No records matched &ldquo;{query}&rdquo;. Try another Roll Number or Name.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#062C24] text-xs font-semibold text-white">
                  <th className="py-3.5 px-5 border-b border-r border-emerald-800/80">
                    <button
                      type="button"
                      onClick={() => toggleSort('roll_no')}
                      className="inline-flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
                    >
                      Roll Number
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 border-b border-r border-emerald-800/80">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
                    >
                      Student Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 border-b border-r border-emerald-800/80 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('age')}
                      className="inline-flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
                    >
                      Age
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 border-b border-r border-emerald-800/80">
                    <button
                      type="button"
                      onClick={() => toggleSort('created_at')}
                      className="inline-flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
                    >
                      Recorded At
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-5 border-b border-emerald-950 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm">
                {filteredAndSorted.map((student) => (
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
                    <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap border-t border-r border-slate-300">
                      {student.created_at}
                    </td>
                    <td className="py-2.5 px-5 text-right border-t border-slate-300">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0D6B58] transition-colors whitespace-nowrap"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
