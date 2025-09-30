import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { calculateAbsencePercentage } from '../utils/attendance';
import type { Attendance } from '@prisma/client';

export const studentRouter = Router();

studentRouter.use(authorize(['student']));

studentRouter.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: {
      class: {
        students: {
          some: {
            studentId: req.user!.id,
            isActive: true,
          },
        },
      },
    },
    include: {
      class: true,
      teacher: {
        include: {
          user: true,
        },
      },
    },
  });
  res.json({ message: 'student.courses.list_success', data: courses });
});

studentRouter.get('/courses/:id/attendance-summary', async (req, res) => {
  const courseId = Number(req.params.id);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      class: {
        include: {
          students: true,
        },
      },
      sessions: {
        include: {
          attendances: {
            where: { studentId: req.user!.id },
          },
          term: true,
        },
      },
      teacher: { include: { user: true } },
    },
  });
  if (!course) {
    return res.status(404).json({ message: 'student.courses.not_found' });
  }
  const isMember = await prisma.classStudent.findFirst({ where: { classId: course.classId, studentId: req.user!.id, isActive: true } });
  if (!isMember) {
    return res.status(403).json({ message: 'auth.errors.forbidden' });
  }
  const totalSessions = course.sessions.length;
  type SessionWithAttendance = (typeof course.sessions)[number];

  const totalAbsences = course.sessions.filter((session: SessionWithAttendance) =>
    session.attendances.some((attendance: Attendance) => attendance.status !== 'present'),
  ).length;
  const percentage = calculateAbsencePercentage(totalSessions, totalAbsences);

  const threshold = course.sessions[0]?.term.absenceThresholdPercent ?? 30;
  const shouldWarn = percentage >= threshold;

  res.json({
    message: 'student.attendance.summary',
    data: {
      course: {
        id: course.id,
        name: course.name,
        className: `${course.class.grade}/${course.class.branch}`,
        teacherName: course.teacher.user.name,
        teacherColor: course.teacher.displayColor,
      },
      totalSessions,
      totalAbsences,
      percentage,
      threshold,
      warn: shouldWarn,
      sessions: course.sessions.map((session: SessionWithAttendance) => ({
        sessionId: session.id,
        date: session.date.toISOString(),
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        status: session.attendances[0]?.status ?? 'present',
      })),
    },
  });
});
