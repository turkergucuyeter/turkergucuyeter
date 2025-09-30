export type AttendanceStatusOption = 'present' | 'excused' | 'unexcused';

export interface AttendanceEntry {
  studentId: number;
  status: AttendanceStatusOption;
}
