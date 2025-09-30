export type Role = 'supervisor' | 'teacher' | 'student';

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
  teacherColor?: string | null;
}

export interface AttendanceOption {
  studentId: number;
  name: string;
  status: 'present' | 'excused' | 'unexcused';
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  channel: 'inapp' | 'webpush';
}
