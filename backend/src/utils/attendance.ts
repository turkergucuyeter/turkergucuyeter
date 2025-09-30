import { AttendanceStatus, ScheduleSession } from "@prisma/client";

export const calculateAttendancePercentage = (sessions: (ScheduleSession & {
  attendances: {
    status: AttendanceStatus;
  }[];
})[], countExcused = true) => {
  const totalSessions = sessions.length;
  if (totalSessions === 0) {
    return 0;
  }

  let absenceCount = 0;
  for (const session of sessions) {
    const status = session.attendances[0]?.status;
    if (!status) {
      continue;
    }
    if (status === AttendanceStatus.unexcused) {
      absenceCount += 1;
    } else if (status === AttendanceStatus.excused && countExcused) {
      absenceCount += 1;
    }
  }

  return Math.round((absenceCount / totalSessions) * 1000) / 10;
};
