import {
  LayoutDashboard,
  UserPlus,
  Users,
  UserPen,
  UserMinus,
  FileCode2,
  GraduationCap,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/student';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  totalStudents: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const PRIMARY_NAV: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add', label: 'Add Student', icon: UserPlus },
  { id: 'view', label: 'View & Search', icon: Users },
  { id: 'update', label: 'Update Student', icon: UserPen },
  { id: 'delete', label: 'Delete Student', icon: UserMinus },
];

export function Sidebar({
  activeSection,
  onNavigate,
  totalStudents,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (section: NavSection) => {
    onNavigate(section);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#062C24] text-emerald-50 border-r border-emerald-950 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand Wordmark */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-emerald-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0C4438] text-white border border-emerald-800/70">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-bold tracking-tight text-white truncate">
                Student Manager
              </div>
              <div className="text-xs text-emerald-200/75 truncate">
                Academic Records
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-[#0A3B30] hover:text-white lg:hidden focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-xs font-medium text-emerald-200/70">
            Records & Operations
          </div>

          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  isActive
                    ? 'bg-[#0F5C4B] text-white shadow-sm'
                    : 'text-emerald-100/80 hover:bg-[#0A3B30] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'view' && (
                  <span className="font-mono text-xs tabular-nums text-emerald-200">
                    {totalStudents}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-5 mt-5 border-t border-emerald-900/70">
            <div className="px-3 pb-2 text-xs font-medium text-emerald-200/70">
              Deliverables
            </div>
            <button
              type="button"
              onClick={() => handleSelect('python')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                activeSection === 'python'
                  ? 'bg-[#0F5C4B] text-white shadow-sm'
                  : 'text-emerald-100/80 hover:bg-[#0A3B30] hover:text-white'
              }`}
            >
              <FileCode2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Python & Deploy Guide</span>
            </button>
          </div>
        </nav>

        {/* Quiet Footer Summary */}
        <div className="px-5 py-4 border-t border-emerald-900/70 text-xs text-emerald-200/75">
          <div>SQLite Persistent Storage</div>
          <div className="mt-0.5 text-emerald-300/60">
            {totalStudents} {totalStudents === 1 ? 'student' : 'students'} saved
          </div>
        </div>
      </aside>
    </>
  );
}
