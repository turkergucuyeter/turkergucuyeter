import prisma from './prisma.js';
import { AttendanceStatus, Role } from '@prisma/client';
import { addMinutes, isAfter, isBefore } from 'date-fns';
import { ApiError } from '../middlewares/errorHandlers.js';
import featureFlagService from './featureFlagService.js';

type PercentageOptions = {
  courseId?: number;
  studentId: number;
  termId?: number;
};

export const calculateAbsencePercentage = async ({ studentId, courseId, termId }: PercentageOptions) => {
  const courseFilter = courseId ? { courseId } : {};
  const termFilter = termId ? { termId } : {};

  const sessions = await prisma.scheduleSession.findMany({
    where: {
      ...courseFilter,
      ...termFilter
    },
    include: {
      attendances: {
        where: { studentId }
      }
    }
  });

  const totalSessions = sessions.length;
  if (totalSessions === 0) {
    return 0;
  }

  const onlyUnexcused = await featureFlagService.isOnlyUnexcusedCounted();

  let absenceCount = 0;
  sessions.forEach((session) => {
    const attendance = session.attendances[0];
    if (!attendance) {
      absenceCount += 1;
      return;
    }
    if (onlyUnexcused) {
      if (attendance.status === AttendanceStatus.unexcused) {
        absenceCount += 1;
      }
    } else if (attendance.status !== AttendanceStatus.present) {
      absenceCount += 1;
    }
  });

  return Math.round((absenceCount / totalSessions) * 100);
};

export const ensureSessionEditable = async (sessionId: number, userRole: Role) => {
  const session = await prisma.scheduleSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new ApiError(404, 'Ders oturumu bulunamadı');
  }

  if (session.isLocked && userRole !== 'supervisor') {
    throw new ApiError(400, 'Ders oturumu artık düzenlenemez');
  }

  const gracePeriodFlag = await featureFlagService.getGracePeriod();
  const now = new Date();
  const endWithGrace = gracePeriodFlag ? addMinutes(session.endTime, gracePeriodFlag) : session.endTime;

  if (userRole === 'teacher') {
    if (isAfter(now, endWithGrace)) {
      await prisma.scheduleSession.update({ where: { id: sessionId }, data: { isLocked: true } });
      throw new ApiError(400, 'Ders oturumu kilitlendi');
    }
    if (isBefore(now, session.startTime)) {
      throw new ApiError(400, 'Ders henüz başlamadı');
    }
  }

  return session;
};

export const upsertAttendance = async (
  sessionId: number,
  takenById: number,
  entries: Array<{ studentId: number; status: AttendanceStatus }>
) => {
  const session = await ensureSessionEditable(sessionId, 'teacher');

  const results = await Promise.all(
    entries.map((entry) =>
      prisma.attendance.upsert({
        where: {
          scheduleSessionId_studentId: {
            scheduleSessionId: sessionId,
            studentId: entry.studentId
          }
        },
        update: {
          status: entry.status,
          takenById,
          takenAt: new Date()
        },
        create: {
          scheduleSessionId: sessionId,
          studentId: entry.studentId,
          status: entry.status,
          takenById
        }
      })
    )
  );

  return { session, results };
};
