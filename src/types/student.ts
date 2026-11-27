export interface Student {
  roll_no: number;
  name: string;
  age: number;
  created_at: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  averageAge: number | null;
  youngestStudent: Student | null;
  recentStudents: Student[];
}

export interface DeliverableFile {
  name: string;
  label: string;
  language: string;
  content: string;
}

export type NavSection =
  | 'dashboard'
  | 'add'
  | 'view'
  | 'update'
  | 'delete'
  | 'python';

export type SearchByMode = 'both' | 'roll' | 'name';

export interface ToastNotice {
  id: number;
  type: 'success' | 'error';
  message: string;
}
