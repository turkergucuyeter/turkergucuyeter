import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../services/prisma.js';
import { calculateAbsencePercentage } from '../services/attendanceService.js';
import { ApiError } from '../middlewares/errorHandlers.js';

const router = Router();

router.use(authenticate, requireRole('student'));

/**
 * @openapi
 * /student/me:
 *   get:
 *     summary: Öğrenci profilini döndürür
 *     tags:
 *       - Student
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({
      where: { id: req.user!.id },
      include: {
        user: true,
        classes: {
          include: {
            class: true
          }
        }
      }
    });
    res.json(student);
  })
);

/**
 * @openapi
 * /student/me/courses:
 *   get:
 *     summary: Öğrencinin derslerini listeler
 *     tags:
 *       - Student
 */
router.get(
  '/me/courses',
  asyncHandler(async (req, res) => {
    const courseMemberships = await prisma.classStudent.findMany({
      where: { studentId: req.user!.id },
      include: {
        class: true
      }
    });

    const classIds = courseMemberships.map((membership) => membership.classId);

    const courses = await prisma.course.findMany({
      where: { classId: { in: classIds } },
      include: {
        teacher: {
          include: { user: true }
        },
        class: true
      }
    });

    res.json({ courses });
  })
);

/**
 * @openapi
 * /student/me/courses/{courseId}/attendance-summary:
 *   get:
 *     summary: Ders bazlı devamsızlık özetini getirir
 *     tags:
 *       - Student
 */
router.get(
  '/me/courses/:courseId/attendance-summary',
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.courseId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        class: {
          include: {
            students: {
              where: { studentId: req.user!.id }
            }
          }
        }
      }
    });

    if (!course) {
      throw new ApiError(404, 'Ders bulunamadı');
    }

    const isMember = course.class.students.some((student) => student.studentId === req.user!.id);
    if (!isMember) {
      throw new ApiError(403, 'Bu derse kayıtlı değilsiniz');
    }

    const sessions = await prisma.scheduleSession.findMany({
      where: { courseId },
      orderBy: { startTime: 'asc' }
    });

    const attendances = await prisma.attendance.findMany({
      where: { scheduleSessionId: { in: sessions.map((session) => session.id) }, studentId: req.user!.id }
    });

    const absencePercent = await calculateAbsencePercentage({
      courseId,
      studentId: req.user!.id,
      termId: sessions[0]?.termId
    });

    res.json({ sessions, attendances, absencePercent });
  })
);

export default router;
