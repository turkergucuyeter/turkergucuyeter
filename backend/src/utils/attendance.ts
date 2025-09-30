import { AttendanceStatus } from '@prisma/client';

export const calculateAbsencePercentage = (
  totalSessions: number,
  absences: number,
) => {
  if (totalSessions === 0) return 0;
  return Number(((absences / totalSessions) * 100).toFixed(2));
};

export const statusFromString = (status: string): AttendanceStatus => {
  switch (status) {
    case 'present':
      return AttendanceStatus.present;
    case 'excused':
      return AttendanceStatus.excused;
    case 'unexcused':
      return AttendanceStatus.unexcused;
    default:
      throw new Error('Invalid attendance status');
  }
};
