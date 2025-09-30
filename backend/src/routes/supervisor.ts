import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '../utils/audit';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { calculateAbsencePercentage } from '../utils/attendance';
import { parse } from 'csv-parse/sync';
import type { Prisma } from '@prisma/client';

export const supervisorRouter = Router();

supervisorRouter.use(authorize(['supervisor']));

const userBaseSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const teacherSchema = userBaseSchema.extend({
  displayColor: z.string().min(3),
});

supervisorRouter.get('/teachers', async (_req, res) => {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
    },
  });
  res.json({ message: 'supervisor.teachers.list_success', data: teachers });
});

supervisorRouter.post('/teachers', async (req, res) => {
  const parseResult = teacherSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const { name, email, password, displayColor } = parseResult.data;
  const hashed = await bcrypt.hash(password, 10);

  const teacher = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash: hashed,
        role: 'teacher',
      },
    });
    const createdTeacher = await tx.teacher.create({
      data: {
        id: user.id,
        displayColor,
      },
    });
    return { user, teacher: createdTeacher };
  });

  await createAuditLog(req.user!.id, 'create', 'teacher', teacher.teacher.id, { email });
  res.status(201).json({ message: 'supervisor.teachers.created', data: teacher });
});

const teacherUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  displayColor: z.string().min(3).optional(),
});

supervisorRouter.patch('/teachers/:id', async (req, res) => {
  const teacherId = Number(req.params.id);
  const parseResult = teacherUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }

  const { name, email, password, displayColor } = parseResult.data;
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (Object.keys(data).length > 0) {
      await tx.user.update({ where: { id: teacherId }, data });
    }
    if (displayColor) {
      await tx.teacher.update({ where: { id: teacherId }, data: { displayColor } });
    }
    return tx.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
  });

  if (!updated) {
    return res.status(404).json({ message: 'supervisor.teachers.not_found' });
  }

  await createAuditLog(req.user!.id, 'update', 'teacher', teacherId, { fields: Object.keys(parseResult.data) });
  res.json({ message: 'supervisor.teachers.updated', data: updated });
});

supervisorRouter.delete('/teachers/:id', async (req, res) => {
  const teacherId = Number(req.params.id);
  await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => null);
  await prisma.user.delete({ where: { id: teacherId } }).catch(() => null);
  await createAuditLog(req.user!.id, 'delete', 'teacher', teacherId);
  res.json({ message: 'supervisor.teachers.deleted' });
});

const studentSchema = userBaseSchema.extend({
  studentNo: z.string().min(3),
  guardianContact: z.string().optional(),
});

supervisorRouter.get('/students', async (_req, res) => {
  const students = await prisma.student.findMany({ include: { user: true, classLinks: true } });
  res.json({ message: 'supervisor.students.list_success', data: students });
});

supervisorRouter.post('/students', async (req, res) => {
  const parseResult = studentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const { name, email, password, studentNo, guardianContact } = parseResult.data;
  const hashed = await bcrypt.hash(password, 10);

  const student = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash: hashed,
        role: 'student',
      },
    });
    const createdStudent = await tx.student.create({
      data: {
        id: user.id,
        studentNo,
        guardianContact: guardianContact ?? null,
      },
    });
    return { user, student: createdStudent };
  });

  await createAuditLog(req.user!.id, 'create', 'student', student.student.id, { email });
  res.status(201).json({ message: 'supervisor.students.created', data: student });
});

const studentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  studentNo: z.string().min(3).optional(),
  guardianContact: z.string().optional(),
});

supervisorRouter.patch('/students/:id', async (req, res) => {
  const studentId = Number(req.params.id);
  const parseResult = studentUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }

  const { name, email, password, studentNo, guardianContact } = parseResult.data;
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (Object.keys(data).length > 0) {
      await tx.user.update({ where: { id: studentId }, data });
    }
    await tx.student.update({
      where: { id: studentId },
      data: {
        ...(studentNo ? { studentNo } : {}),
        guardianContact: guardianContact ?? null,
      },
    });
    return tx.student.findUnique({ where: { id: studentId }, include: { user: true } });
  }).catch(() => null);

  if (!updated) {
    return res.status(404).json({ message: 'supervisor.students.not_found' });
  }

  await createAuditLog(req.user!.id, 'update', 'student', studentId, { fields: Object.keys(parseResult.data) });
  res.json({ message: 'supervisor.students.updated', data: updated });
});

supervisorRouter.delete('/students/:id', async (req, res) => {
  const studentId = Number(req.params.id);
  await prisma.student.delete({ where: { id: studentId } }).catch(() => null);
  await prisma.user.delete({ where: { id: studentId } }).catch(() => null);
  await createAuditLog(req.user!.id, 'delete', 'student', studentId);
  res.json({ message: 'supervisor.students.deleted' });
});

supervisorRouter.post('/students/bulk', async (req, res) => {
  if (typeof req.body?.csv !== 'string') {
    return res.status(400).json({ message: 'supervisor.students.bulk_missing_csv' });
  }
  const { csv } = req.body;
  type BulkStudentRow = {
    name: string;
    email: string;
    password?: string;
    student_no?: string;
    studentNo?: string;
    guardian_contact?: string;
    guardianContact?: string;
  };

  const records = parse<BulkStudentRow>(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const successes: number[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const row = records[index]!;
    const parsed = studentSchema.safeParse({
      name: row.name,
      email: row.email,
      password: row.password ?? 'Parola123!',
      studentNo: row.student_no ?? row.studentNo,
      guardianContact: row.guardian_contact ?? undefined,
    });
    if (!parsed.success) {
      errors.push({ row: index + 1, message: parsed.error.message });
      continue;
    }
    const { name, email, password, studentNo, guardianContact } = parsed.data;
    const hashed = await bcrypt.hash(password, 10);
    try {
      const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash: hashed,
            role: 'student',
          },
        });
        const student = await tx.student.create({
          data: {
            id: user.id,
            studentNo,
            guardianContact: guardianContact ?? null,
          },
        });
        return student.id;
      });
      successes.push(created);
    } catch (error) {
      errors.push({ row: index + 1, message: 'supervisor.students.bulk_row_failed' });
    }
  }

  await createAuditLog(req.user!.id, 'create-bulk', 'student', successes.length, { errors });
  res.json({
    message: 'supervisor.students.bulk_result',
    data: {
      imported: successes.length,
      errors,
    },
  });
});

const classSchema = z.object({
  name: z.string(),
  grade: z.string(),
  branch: z.string(),
});

supervisorRouter.get('/classes', async (_req, res) => {
  const classes = await prisma.class.findMany({ include: { students: true, courses: true } });
  res.json({ message: 'supervisor.classes.list_success', data: classes });
});

supervisorRouter.post('/classes', async (req, res) => {
  const parseResult = classSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const created = await prisma.class.create({
    data: {
      ...parseResult.data,
      createdBy: req.user!.id,
    },
  });
  await createAuditLog(req.user!.id, 'create', 'class', created.id);
  res.status(201).json({ message: 'supervisor.classes.created', data: created });
});

supervisorRouter.patch('/classes/:id', async (req, res) => {
  const classId = Number(req.params.id);
  const parseResult = classSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const updateData: Record<string, unknown> = {};
  if (parseResult.data.name !== undefined) updateData.name = parseResult.data.name;
  if (parseResult.data.grade !== undefined) updateData.grade = parseResult.data.grade;
  if (parseResult.data.branch !== undefined) updateData.branch = parseResult.data.branch;

  const updated = await prisma.class.update({ where: { id: classId }, data: updateData }).catch(() => null);
  if (!updated) {
    return res.status(404).json({ message: 'supervisor.classes.not_found' });
  }
  await createAuditLog(req.user!.id, 'update', 'class', classId, { fields: Object.keys(parseResult.data) });
  res.json({ message: 'supervisor.classes.updated', data: updated });
});

supervisorRouter.delete('/classes/:id', async (req, res) => {
  const classId = Number(req.params.id);
  await prisma.class.delete({ where: { id: classId } }).catch(() => null);
  await createAuditLog(req.user!.id, 'delete', 'class', classId);
  res.json({ message: 'supervisor.classes.deleted' });
});

const courseSchema = z.object({
  classId: z.number(),
  name: z.string(),
  code: z.string(),
  teacherId: z.number(),
  weeklyHours: z.number(),
});

supervisorRouter.get('/courses', async (_req, res) => {
  const courses = await prisma.course.findMany({ include: { class: true, teacher: { include: { user: true } } } });
  res.json({ message: 'supervisor.courses.list_success', data: courses });
});

supervisorRouter.post('/courses', async (req, res) => {
  const parseResult = courseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const created = await prisma.course.create({ data: parseResult.data });
  await createAuditLog(req.user!.id, 'create', 'course', created.id);
  res.status(201).json({ message: 'supervisor.courses.created', data: created });
});

supervisorRouter.patch('/courses/:id', async (req, res) => {
  const courseId = Number(req.params.id);
  const parseResult = courseSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const courseUpdateData: Record<string, unknown> = {};
  if (parseResult.data.classId !== undefined) courseUpdateData.classId = parseResult.data.classId;
  if (parseResult.data.name !== undefined) courseUpdateData.name = parseResult.data.name;
  if (parseResult.data.code !== undefined) courseUpdateData.code = parseResult.data.code;
  if (parseResult.data.teacherId !== undefined) courseUpdateData.teacherId = parseResult.data.teacherId;
  if (parseResult.data.weeklyHours !== undefined) courseUpdateData.weeklyHours = parseResult.data.weeklyHours;

  const updated = await prisma.course.update({ where: { id: courseId }, data: courseUpdateData }).catch(() => null);
  if (!updated) {
    return res.status(404).json({ message: 'supervisor.courses.not_found' });
  }
  await createAuditLog(req.user!.id, 'update', 'course', courseId, { fields: Object.keys(parseResult.data) });
  res.json({ message: 'supervisor.courses.updated', data: updated });
});

supervisorRouter.delete('/courses/:id', async (req, res) => {
  const courseId = Number(req.params.id);
  await prisma.course.delete({ where: { id: courseId } }).catch(() => null);
  await createAuditLog(req.user!.id, 'delete', 'course', courseId);
  res.json({ message: 'supervisor.courses.deleted' });
});

const termSchema = z.object({
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  absenceThresholdPercent: z.number().min(0).max(100).optional(),
});

supervisorRouter.get('/terms', async (_req, res) => {
  const terms = await prisma.term.findMany();
  res.json({ message: 'supervisor.terms.list_success', data: terms });
});

supervisorRouter.post('/terms', async (req, res) => {
  const parseResult = termSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const { name, startDate, endDate, absenceThresholdPercent } = parseResult.data;
  const created = await prisma.term.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      absenceThresholdPercent: absenceThresholdPercent ?? 30,
    },
  });
  await createAuditLog(req.user!.id, 'create', 'term', created.id);
  res.status(201).json({ message: 'supervisor.terms.created', data: created });
});

supervisorRouter.patch('/terms/:id', async (req, res) => {
  const termId = Number(req.params.id);
  const parseResult = termSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const data: any = { ...parseResult.data };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  const updated = await prisma.term.update({ where: { id: termId }, data }).catch(() => null);
  if (!updated) {
    return res.status(404).json({ message: 'supervisor.terms.not_found' });
  }
  await createAuditLog(req.user!.id, 'update', 'term', termId, { fields: Object.keys(parseResult.data) });
  res.json({ message: 'supervisor.terms.updated', data: updated });
});

supervisorRouter.delete('/terms/:id', async (req, res) => {
  const termId = Number(req.params.id);
  await prisma.term.delete({ where: { id: termId } }).catch(() => null);
  await createAuditLog(req.user!.id, 'delete', 'term', termId);
  res.json({ message: 'supervisor.terms.deleted' });
});

const sessionSchema = z.object({
  courseId: z.number(),
  termId: z.number(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  teacherId: z.number(),
});

supervisorRouter.get('/schedule-sessions', async (_req, res) => {
  const sessions = await prisma.scheduleSession.findMany({ include: { course: true, term: true } });
  res.json({ message: 'supervisor.sessions.list_success', data: sessions });
});

supervisorRouter.post('/schedule-sessions', async (req, res) => {
  const parseResult = sessionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const { courseId, termId, date, startTime, endTime, teacherId } = parseResult.data;
  const created = await prisma.scheduleSession.create({
    data: {
      courseId,
      termId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      teacherId,
    },
  });
  await createAuditLog(req.user!.id, 'create', 'scheduleSession', created.id);
  res.status(201).json({ message: 'supervisor.sessions.created', data: created });
});

supervisorRouter.patch('/schedule-sessions/:id', async (req, res) => {
  const sessionId = Number(req.params.id);
  const parseResult = sessionSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error', issues: parseResult.error.flatten() });
  }
  const data: any = { ...parseResult.data };
  if (data.date) data.date = new Date(data.date);
  if (data.startTime) data.startTime = new Date(data.startTime);
  if (data.endTime) data.endTime = new Date(data.endTime);
  const updated = await prisma.scheduleSession.update({ where: { id: sessionId }, data }).catch(() => null);
  if (!updated) {
    return res.status(404).json({ message: 'supervisor.sessions.not_found' });
  }
  await createAuditLog(req.user!.id, 'update', 'scheduleSession', sessionId, { fields: Object.keys(parseResult.data) });
  res.json({ message: 'supervisor.sessions.updated', data: updated });
});

supervisorRouter.delete('/schedule-sessions/:id', async (req, res) => {
  const sessionId = Number(req.params.id);
  await prisma.scheduleSession.delete({ where: { id: sessionId } }).catch(() => null);
  await createAuditLog(req.user!.id, 'delete', 'scheduleSession', sessionId);
  res.json({ message: 'supervisor.sessions.deleted' });
});

const featureFlagSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

supervisorRouter.get('/feature-flags', async (_req, res) => {
  const flags = await prisma.featureFlag.findMany();
  res.json({ message: 'supervisor.feature_flags.list_success', data: flags });
});

supervisorRouter.put('/feature-flags/:key', async (req, res) => {
  const parseResult = featureFlagSchema.safeParse({ key: req.params.key, value: req.body });
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error' });
  }
  const { key, value } = parseResult.data;
  const upserted = await prisma.featureFlag.upsert({
    where: { key },
    create: { key, valueJson: JSON.stringify(value) },
    update: { valueJson: JSON.stringify(value) },
  });
  const meta = typeof value === 'object' && value !== null ? value as Record<string, unknown> : { value };
  await createAuditLog(req.user!.id, 'upsert', 'featureFlag', 0, { key, ...meta });
  res.json({ message: 'supervisor.feature_flags.updated', data: upserted });
});

const reportQuerySchema = z.object({
  classId: z.string().optional(),
  courseId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
});

supervisorRouter.get('/reports/attendance', async (req, res) => {
  const parseResult = reportQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'common.validation_error' });
  }
  const { classId, courseId, from, to, format } = parseResult.data;
  const where: any = {};
  if (courseId) {
    where.courseId = Number(courseId);
  }
  if (classId) {
    where.course = { classId: Number(classId) };
  }
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }

  const sessions = await prisma.scheduleSession.findMany({
    where,
    include: {
      course: {
        include: {
          class: true,
          teacher: { include: { user: true } },
        },
      },
      attendances: {
        include: {
          student: { include: { user: true } },
        },
      },
    },
  });

  const rows = sessions.map((session) => {
    const total = session.attendances.length;
    const absent = session.attendances.filter((a) => a.status !== 'present').length;
    const percentage = calculateAbsencePercentage(total, absent);
    return {
      sessionId: session.id,
      course: session.course.name,
      class: `${session.course.class.grade}/${session.course.class.branch}`,
      teacher: session.course.teacher.user.name,
      date: session.date.toISOString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      total,
      absent,
      percentage,
    };
  });

  if (format === 'csv') {
    res.header('Content-Type', 'text/csv');
    const csv = stringify(rows, { header: true });
    res.send(csv);
    return;
  }

  if (format === 'pdf') {
    res.header('Content-Type', 'application/pdf');
    const doc = new PDFDocument();
    doc.pipe(res as unknown as Response);
    doc.fontSize(18).text('Yoklama Raporu', { align: 'center' });
    doc.moveDown();
  rows.forEach((row) => {
      doc.fontSize(12).text(`Oturum #${row.sessionId} - ${row.course}`);
      doc.text(`Sınıf: ${row.class} | Öğretmen: ${row.teacher}`);
      doc.text(`Tarih: ${row.date} | ${row.startTime} - ${row.endTime}`);
      doc.text(`Toplam: ${row.total} | Devamsız: ${row.absent} | %${row.percentage}`);
      doc.moveDown();
    });
    doc.end();
    return;
  }

  res.json({ message: 'supervisor.reports.generated', data: rows });
});
