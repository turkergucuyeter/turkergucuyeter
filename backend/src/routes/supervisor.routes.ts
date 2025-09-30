import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../services/prisma.js';
import { ApiError } from '../middlewares/errorHandlers.js';
import { hashPassword } from '../services/authService.js';
import auditService from '../services/auditService.js';
import { parse } from 'csv-parse/sync';
import notificationService from '../services/notificationService.js';

const router = Router();

router.use(authenticate, requireRole('supervisor'));

/**
 * @openapi
 * /supervisor/teachers:
 *   get:
 *     summary: Tüm öğretmenleri listeler
 *     tags:
 *       - Supervisor
 */
router.get(
  '/teachers',
  asyncHandler(async (_req, res) => {
    const teachers = await prisma.teacher.findMany({
      include: { user: true }
    });
    res.json(teachers);
  })
);

/**
 * @openapi
 * /supervisor/teachers:
 *   post:
 *     summary: Yeni öğretmen oluşturur
 *     tags:
 *       - Supervisor
 */
router.post(
  '/teachers',
  asyncHandler(async (req, res) => {
    const { name, email, password, displayColor } = req.body;
    if (!name || !email || !password || !displayColor) {
      throw new ApiError(400, 'Ad, e-posta, şifre ve renk zorunludur');
    }

    const passwordHash = await hashPassword(password);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'teacher'
        }
      });
      const createdTeacher = await tx.teacher.create({
        data: {
          id: user.id,
          displayColor
        }
      });
      return { ...createdTeacher, user };
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'create',
      entity: 'teacher',
      entityId: teacher.user.id,
      meta: { email }
    });

    res.status(201).json(teacher);
  })
);

router.patch(
  '/teachers/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, email, isActive, displayColor } = req.body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        displayColor,
        user: {
          update: {
            name,
            email,
            isActive
          }
        }
      },
      include: { user: true }
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'update',
      entity: 'teacher',
      entityId: id,
      meta: req.body
    });

    res.json(teacher);
  })
);

router.delete(
  '/teachers/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.teacher.delete({ where: { id } });
    await prisma.user.delete({ where: { id } });

    await auditService.log({
      userId: req.user!.id,
      action: 'delete',
      entity: 'teacher',
      entityId: id
    });

    res.status(204).send();
  })
);

/**
 * @openapi
 * /supervisor/students:
 *   get:
 *     summary: Tüm öğrencileri listeler
 *     tags:
 *       - Supervisor
 */
router.get(
  '/students',
  asyncHandler(async (_req, res) => {
    const students = await prisma.student.findMany({
      include: { user: true, classes: true }
    });
    res.json(students);
  })
);

/**
 * @openapi
 * /supervisor/students:
 *   post:
 *     summary: Yeni öğrenci oluşturur
 *     tags:
 *       - Supervisor
 */
router.post(
  '/students',
  asyncHandler(async (req, res) => {
    const { name, email, password, studentNo, guardianContact, classId } = req.body;
    if (!name || !email || !password || !studentNo) {
      throw new ApiError(400, 'Öğrenci bilgileri eksik');
    }

    const passwordHash = await hashPassword(password);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role: 'student' }
      });
      const createdStudent = await tx.student.create({
        data: {
          id: user.id,
          studentNo,
          guardianContact
        }
      });
      if (classId) {
        await tx.classStudent.create({
          data: { classId, studentId: createdStudent.id }
        });
      }
      return { ...createdStudent, user };
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'create',
      entity: 'student',
      entityId: student.user.id,
      meta: { studentNo }
    });

    res.status(201).json(student);
  })
);

router.post(
  '/students/bulk',
  asyncHandler(async (req, res) => {
    const { csv, defaultPassword } = req.body;
    if (!csv) {
      throw new ApiError(400, 'CSV verisi zorunludur');
    }


    type StudentCsvRow = {
      name: string;
      email: string;
      student_no: string;
      class_code?: string;
    };


    const parsed = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      bom: true

    }) as StudentCsvRow[];

    const successes: StudentCsvRow[] = [];
    });

    const successes: unknown[] = [];

    const errors: Array<{ row: number; error: string }> = [];
    const passwordHash = await hashPassword(defaultPassword ?? 'Sifrem123');

    for (let index = 0; index < parsed.length; index++) {
      const row = parsed[index];
      try {
        const { name, email, student_no: studentNo, class_code: classCode } = row;
        if (!name || !email || !studentNo) {
          throw new Error('Zorunlu alanlar eksik');
        }

        const classroom = classCode
          ? await prisma.class.findUnique({ where: { code: classCode } })
          : null;

        const student = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { name, email, passwordHash, role: 'student' }
          });
          const createdStudent = await tx.student.create({
            data: { id: user.id, studentNo }
          });
          if (classroom) {
            await tx.classStudent.create({
              data: { classId: classroom.id, studentId: createdStudent.id }
            });
          }
          return { ...createdStudent, user };
        });


        successes.push({
          name,
          email,
          student_no: studentNo,
          class_code: classCode ?? undefined
        });

        successes.push(student);
      } catch (error) {
        errors.push({ row: index + 1, error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
      }
    }

    res.json({ successes, errors });
  })
);

router.patch(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, email, isActive, studentNo, guardianContact } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        studentNo,
        guardianContact,
        user: {
          update: {
            name,
            email,
            isActive
          }
        }
      },
      include: { user: true }
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'update',
      entity: 'student',
      entityId: id,
      meta: req.body
    });

    res.json(student);
  })
);

router.delete(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.student.delete({ where: { id } });
    await prisma.user.delete({ where: { id } });

    await auditService.log({
      userId: req.user!.id,
      action: 'delete',
      entity: 'student',
      entityId: id
    });

    res.status(204).send();
  })
);

router.get(
  '/classes',
  asyncHandler(async (_req, res) => {
    const classes = await prisma.class.findMany({ include: { courses: true, students: true } });
    res.json(classes);
  })
);

/**
 * @openapi
 * /supervisor/classes:
 *   post:
 *     summary: Yeni sınıf oluşturur
 *     tags:
 *       - Supervisor
 */
router.post(
  '/classes',
  asyncHandler(async (req, res) => {
    const { name, code, grade, branch } = req.body;
    if (!name || !code || !grade || !branch) {
      throw new ApiError(400, 'Sınıf bilgileri eksik');
    }

    const classroom = await prisma.class.create({
      data: {
        name,
        code,
        grade,
        branch,
        createdBy: req.user!.id
      }
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'create',
      entity: 'class',
      entityId: classroom.id
    });

    res.status(201).json(classroom);
  })
);

router.patch(
  '/classes/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, code, grade, branch } = req.body;

    const classroom = await prisma.class.update({
      where: { id },
      data: { name, code, grade, branch }
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'update',
      entity: 'class',
      entityId: id,
      meta: req.body
    });

    res.json(classroom);
  })
);

router.delete(
  '/classes/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.class.delete({ where: { id } });
    await auditService.log({ userId: req.user!.id, action: 'delete', entity: 'class', entityId: id });
    res.status(204).send();
  })
);

router.get(
  '/courses',
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({ include: { class: true, teacher: { include: { user: true } } } });
    res.json(courses);
  })
);

/**
 * @openapi
 * /supervisor/courses:
 *   post:
 *     summary: Yeni ders oluşturur
 *     tags:
 *       - Supervisor
 */
router.post(
  '/courses',
  asyncHandler(async (req, res) => {
    const { name, code, classId, teacherId, weeklyHours } = req.body;
    if (!name || !code || !classId || !teacherId) {
      throw new ApiError(400, 'Ders bilgileri eksik');
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        classId,
        teacherId,
        weeklyHours
      }
    });

    await auditService.log({ userId: req.user!.id, action: 'create', entity: 'course', entityId: course.id });

    res.status(201).json(course);
  })
);

router.patch(
  '/courses/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, code, teacherId, weeklyHours } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        code,
        teacherId,
        weeklyHours
      }
    });

    await auditService.log({ userId: req.user!.id, action: 'update', entity: 'course', entityId: id, meta: req.body });

    res.json(course);
  })
);

router.delete(
  '/courses/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.course.delete({ where: { id } });
    await auditService.log({ userId: req.user!.id, action: 'delete', entity: 'course', entityId: id });
    res.status(204).send();
  })
);

router.get(
  '/terms',
  asyncHandler(async (_req, res) => {
    const terms = await prisma.term.findMany();
    res.json(terms);
  })
);

/**
 * @openapi
 * /supervisor/terms:
 *   post:
 *     summary: Yeni dönem oluşturur
 *     tags:
 *       - Supervisor
 */
router.post(
  '/terms',
  asyncHandler(async (req, res) => {
    const { name, startDate, endDate, absenceThresholdPercent } = req.body;
    if (!name || !startDate || !endDate) {
      throw new ApiError(400, 'Dönem bilgileri eksik');
    }

    const term = await prisma.term.create({
      data: {
        name,
        startDate,
        endDate,
        absenceThresholdPercent
      }
    });

    await auditService.log({ userId: req.user!.id, action: 'create', entity: 'term', entityId: term.id });

    res.status(201).json(term);
  })
);

router.patch(
  '/terms/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, startDate, endDate, absenceThresholdPercent } = req.body;

    const term = await prisma.term.update({
      where: { id },
      data: { name, startDate, endDate, absenceThresholdPercent }
    });

    await auditService.log({ userId: req.user!.id, action: 'update', entity: 'term', entityId: id, meta: req.body });

    res.json(term);
  })
);

/**
 * @openapi
 * /supervisor/schedule-sessions:
 *   post:
 *     summary: Ders oturumu planlar
 *     tags:
 *       - Supervisor
 */
router.post(
  '/schedule-sessions',
  asyncHandler(async (req, res) => {
    const { courseId, termId, date, startTime, endTime } = req.body;
    if (!courseId || !termId || !date || !startTime || !endTime) {
      throw new ApiError(400, 'Oturum bilgileri eksik');
    }

    const session = await prisma.scheduleSession.create({
      data: {
        courseId,
        termId,
        date,
        startTime,
        endTime
      }
    });

    await auditService.log({ userId: req.user!.id, action: 'create', entity: 'session', entityId: session.id });

    res.status(201).json(session);
  })
);

router.patch(
  '/schedule-sessions/:id/lock',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { isLocked } = req.body;

    const session = await prisma.scheduleSession.update({
      where: { id },
      data: { isLocked: Boolean(isLocked) }
    });

    await auditService.log({ userId: req.user!.id, action: 'lock', entity: 'session', entityId: id, meta: req.body });

    res.json(session);
  })
);

/**
 * @openapi
 * /supervisor/dashboard/overview:
 *   get:
 *     summary: Panel özet sayıları döndürür
 *     tags:
 *       - Supervisor
 */
router.get(
  '/dashboard/overview',
  asyncHandler(async (_req, res) => {
    const [teacherCount, studentCount, classCount, upcomingSessions] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.class.count(),
      prisma.scheduleSession.findMany({
        orderBy: { startTime: 'asc' },
        take: 5,
        include: { course: true }
      })
    ]);

    res.json({
      teacherCount,
      studentCount,
      classCount,
      upcomingSessions
    });
  })
);

router.post(
  '/notifications/test',
  asyncHandler(async (req, res) => {
    const { userId, title, body } = req.body;
    if (!userId || !title || !body) {
      throw new ApiError(400, 'Kullanıcı, başlık ve içerik zorunludur');
    }

    const notification = await notificationService.createNotification(userId, 'inapp', title, body);
    res.status(201).json(notification);
  })
);

export default router;
