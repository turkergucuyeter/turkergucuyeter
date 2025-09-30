export type UserRole = 'supervisor' | 'teacher' | 'student';

export interface AuthUser {
  id: number;
  role: UserRole;
  name: string;
  email: string;
}
