import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../services/prisma.js';
import { ApiError } from '../middlewares/errorHandlers.js';
import { calculateAbsencePercentage, upsertAttendance } from '../services/attendanceService.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import pushService from '../services/pushService.js';

const router = Router();

router.use(authenticate, requireRole('teacher'));

/**
 * @openapi
 * /teacher/me:
 *   get:
 *     summary: Öğretmen profilini döndürür
 *     tags:
 *       - Teacher
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.user!.id },
      include: { user: true }
    });
    res.json(teacher);
  })
);

/**
 * @openapi
 * /teacher/my/classes:
 *   get:
 *     summary: Öğretmenin sınıf ve derslerini listeler
 *     tags:
 *       - Teacher
 */
router.get(
  '/my/classes',
  asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
      where: { teacherId: req.user!.id },
      include: {
        class: true
      }
    });

    const grouped = courses.reduce<Record<number, { classId: number; name: string; grade: string; branch: string; code: string }>>(
      (acc, course) => {
        const classId = course.classId;
        if (!acc[classId]) {
          acc[classId] = {
            classId,
            name: course.class.name,
            grade: course.class.grade,
            branch: course.class.branch,
            code: course.class.code
          };
        }
        return acc;
      },
      {}
    );

    res.json({
      classes: Object.values(grouped),
      courses
    });
  })
);

/**
 * @openapi
 * /teacher/classes/{classId}/sessions:
 *   get:
 *     summary: Seçili sınıfın ders oturumlarını döndürür
 *     tags:
 *       - Teacher
 */
router.get(
  '/classes/:classId/sessions',
  asyncHandler(async (req, res) => {
    const classId = Number(req.params.classId);
    const dateParam = req.query.date ? new Date(String(req.query.date)) : null;
    const startOfDay = dateParam
      ? new Date(new Date(dateParam).setHours(0, 0, 0, 0))
      : undefined;
    const endOfDay = dateParam
      ? new Date(new Date(dateParam).setHours(23, 59, 59, 999))
      : undefined;

    const courses = await prisma.course.findMany({
      where: { classId, teacherId: req.user!.id },
      include: { class: true }
    });

    if (courses.length === 0) {
      throw new ApiError(403, 'Bu sınıf için yetkiniz yok');
    }

    const courseIds = courses.map((course) => course.id);
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        courseId: { in: courseIds },
        ...(dateParam && {
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        })
      },
      orderBy: { startTime: 'asc' }
    });

    res.json({ courses, sessions });
  })
);

/**
 * @openapi
 * /teacher/sessions/{id}/attendance:
 *   get:
 *     summary: Oturumun mevcut yoklama bilgilerini getirir
 *     tags:
 *       - Teacher
 */
router.get(
  '/sessions/:id/attendance',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const session = await prisma.scheduleSession.findUnique({
      where: { id },
      include: {
        course: true,
        attendances: {
          include: {
            student: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!session) {
      throw new ApiError(404, 'Oturum bulunamadı');
    }

    if (session.course.teacherId !== req.user!.id) {
      throw new ApiError(403, 'Bu ders için yetkiniz yok');
    }

    const students = await prisma.classStudent.findMany({
      where: { classId: session.course.classId, isActive: true },
      include: {
        student: {
          include: { user: true }
        }
      }
    });

    res.json({ session, attendance: session.attendances, students });
  })
);

/**
 * @openapi
 * /teacher/sessions/{id}/attendance:
 *   post:
 *     summary: Öğrenci yoklamasını kaydeder/günceller
 *     tags:
 *       - Teacher
 */
router.post(
  '/sessions/:id/attendance',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const entries = req.body;
    if (!Array.isArray(entries)) {
      throw new ApiError(400, 'Geçersiz istek');
    }

    entries.forEach((entry) => {
      if (!['present', 'excused', 'unexcused'].includes(entry.status)) {
        throw new ApiError(400, 'Geçersiz yoklama durumu');
      }
    });

    const session = await prisma.scheduleSession.findUnique({
      where: { id },
      include: { course: true, term: true }
    });

    if (!session) {
      throw new ApiError(404, 'Oturum bulunamadı');
    }

    if (session.course.teacherId !== req.user!.id) {
      throw new ApiError(403, 'Bu ders için yetkiniz yok');
    }

    const { results } = await upsertAttendance(id, req.user!.id, entries);

    const threshold = session.term?.absenceThresholdPercent ?? 30;

    await Promise.all(
      entries.map(async (entry) => {
        const absencePercent = await calculateAbsencePercentage({
          courseId: session.courseId,
          studentId: entry.studentId,
          termId: session.termId
        });

        if (absencePercent >= threshold) {
          await notificationService.createNotification(
            entry.studentId,
            'inapp',
            'Devamsızlık Uyarısı',
            `${session.course.name} dersinde devamsızlık oranınız %${absencePercent}`
          );
          await pushService.send(entry.studentId, {
            title: 'Devamsızlık Uyarısı',
            body: `${session.course.name} dersinde devamsızlık oranınız %${absencePercent}`
          });
        }
      })
    );

    await auditService.log({
      userId: req.user!.id,
      action: 'attendance_upsert',
      entity: 'session',
      entityId: id,
      meta: { count: results.length }
    });

    res.json({ message: 'Yoklama kaydedildi', results });
  })
);

export default router;
