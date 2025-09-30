import { addMinutes, isAfter, isBefore } from 'date-fns';
import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { z } from 'zod';
import { env } from '../config/env';
import { createAuditLog } from '../utils/audit';
import { calculateAbsencePercentage } from '../utils/attendance';
import { getFlagValue } from '../utils/featureFlags';
import type { Prisma, Attendance, ScheduleSession } from '@prisma/client';

export const teacherRouter = Router();

teacherRouter.use(authorize(['teacher']));

teacherRouter.get('/classes', async (req, res) => {
  const classes = await prisma.class.findMany({
    where: {
      courses: {
        some: {
          teacherId: req.user!.id,
        },
      },
    },
    include: {
      courses: {
        where: {
          teacherId: req.user!.id,
        },
      },
    },
  });
  res.json({ message: 'teacher.classes.list_success', data: classes });
});

teacherRouter.get('/classes/:id/sessions', async (req, res) => {
  const classId = Number(req.params.id);
  const dateFilter = req.query.date ? new Date(String(req.query.date)) : new Date();

  const sessions = await prisma.scheduleSession.findMany({
    where: {
      course: {
        classId,
        teacherId: req.user!.id,
      },
      date: {
        gte: addMinutes(dateFilter, -1440),
        lte: addMinutes(dateFilter, 1440),
      },
    },
    include: {
      course: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });
  res.json({ message: 'teacher.sessions.list_success', data: sessions });
});

teacherRouter.get('/sessions/:id/attendance', async (req, res) => {
  const sessionId = Number(req.params.id);
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        include: {
          class: {
            include: {
              students: {
                include: {
                  student: { include: { user: true } },
                },
              },
            },
          },
        },
      },
      attendances: true,
    },
  });
  if (!session || session.course.teacherId !== req.user!.id) {
    return res.status(403).json({ message: 'auth.errors.forbidden' });
  }
  res.json({ message: 'teacher.attendance.fetch_success', data: session });
});

const attendanceSchema = z.array(z.object({
  studentId: z.number(),
  status: z.enum(['present', 'excused', 'unexcused']),
}));

const canEditSession = (startTime: Date, endTime: Date) => {
  const now = new Date();
  const graceEnd = addMinutes(endTime, env.attendanceGraceMinutes);
  return isBefore(now, graceEnd) && isAfter(now, addMinutes(startTime, -15));
};

const evaluateStudentAbsence = async (
  sessionId: number,
  studentIds: number[],
) => {
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      term: true,
      course: {
        include: {
          class: true,
        },
      },
    },
  });
  if (!session) return;

  const onlyUnexcused = await getFlagValue<boolean>('absence.only_unexcused', false);

  for (const studentId of studentIds) {
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        courseId: session.courseId,
        termId: session.termId,
      },
      include: {
        attendances: {
          where: { studentId },
        },
      },
    });
    const total = sessions.length;
    let absences = 0;
    sessions.forEach((item: ScheduleSession & { attendances: Attendance[] }) => {
      const attendance = item.attendances[0];
      if (!attendance) {
        absences += 1;
        return;
      }
      if (attendance.status === 'present') return;
      if (onlyUnexcused && attendance.status === 'excused') return;
      absences += 1;
    });

    const percentage = calculateAbsencePercentage(total, absences);
    if (percentage >= session.term.absenceThresholdPercent) {
      await prisma.notification.create({
        data: {
          userId: studentId,
          channel: env.allowWebPush ? 'webpush' : 'inapp',
          title: 'student.notifications.absence_threshold_title',
          body: 'student.notifications.absence_threshold_body',
        },
      });
    }
  }
};

teacherRouter.post('/sessions/:id/attendance', async (req, res) => {
  const sessionId = Number(req.params.id);
  const parseResult = attendanceSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const session = await prisma.scheduleSession.findUnique({ where: { id: sessionId }, include: { attendances: true } });
  if (!session || session.teacherId !== req.user!.id) {
    return res.status(403).json({ message: 'auth.errors.forbidden' });
  }
  if (session.isLocked || !canEditSession(session.startTime, session.endTime)) {
    return res.status(400).json({ message: 'teacher.attendance.locked' });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const item of parseResult.data) {
      await tx.attendance.upsert({
        where: {
          scheduleSessionId_studentId: {
            scheduleSessionId: sessionId,
            studentId: item.studentId,
          },
        },
        create: {
          scheduleSessionId: sessionId,
          studentId: item.studentId,
          status: item.status,
          takenById: req.user!.id,
        },
        update: {
          status: item.status,
          takenById: req.user!.id,
        },
      });
    }
  });

  await createAuditLog(req.user!.id, 'upsert', 'attendance', sessionId, { count: parseResult.data.length });
  await evaluateStudentAbsence(sessionId, parseResult.data.map((item) => item.studentId));

  res.json({ message: 'teacher.attendance.saved' });
});

teacherRouter.patch('/sessions/:id/attendance', async (req, res) => {
  const sessionId = Number(req.params.id);
  const parseResult = attendanceSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const session = await prisma.scheduleSession.findUnique({ where: { id: sessionId } });
  if (!session || session.teacherId !== req.user!.id) {
    return res.status(403).json({ message: 'auth.errors.forbidden' });
  }
  if (session.isLocked || !canEditSession(session.startTime, session.endTime)) {
    return res.status(400).json({ message: 'teacher.attendance.locked' });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const item of parseResult.data) {
      await tx.attendance.update({
        where: {
          scheduleSessionId_studentId: {
            scheduleSessionId: sessionId,
            studentId: item.studentId,
          },
        },
        data: {
          status: item.status,
          takenById: req.user!.id,
        },
      });
    }
  });

  await evaluateStudentAbsence(sessionId, parseResult.data.map((item) => item.studentId));

  res.json({ message: 'teacher.attendance.updated' });
});

teacherRouter.post('/sessions/:id/lock', async (req, res) => {
  const sessionId = Number(req.params.id);
  const session = await prisma.scheduleSession.findUnique({ where: { id: sessionId } });
  if (!session || session.teacherId !== req.user!.id) {
    return res.status(403).json({ message: 'auth.errors.forbidden' });
  }

  const locked = await prisma.scheduleSession.update({ where: { id: sessionId }, data: { isLocked: true } });
  await createAuditLog(req.user!.id, 'update', 'scheduleSession', sessionId, { isLocked: true });
  res.json({ message: 'teacher.sessions.locked', data: locked });
});

teacherRouter.get('/reports/my-attendance', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { teacherId: req.user!.id },
    include: {
      class: {
        include: {
          students: true,
        },
      },
      sessions: {
        include: {
          attendances: true,
        },
      },
    },
  });

  type CourseWithSessions = (typeof courses)[number];

  const data = courses.map((course: CourseWithSessions) => {
    const totalSessions = course.sessions.length;
    const totalAbsences = course.sessions.reduce((acc: number, session: ScheduleSession & { attendances: Attendance[] }) =>
      acc + session.attendances.filter((a: Attendance) => a.status !== 'present').length,
    0);
    const percentage = calculateAbsencePercentage(totalSessions * (course.class.students.length || 1), totalAbsences);
    return {
      courseId: course.id,
      courseName: course.name,
      className: `${course.class.grade}/${course.class.branch}`,
      absencePercentage: percentage,
    };
  });

  res.json({ message: 'teacher.reports.generated', data });
});
