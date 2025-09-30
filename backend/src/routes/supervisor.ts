import { Router } from "express";
import { prisma } from "../config/prisma";
import { authorize } from "../middleware/auth";
import { Role, AttendanceStatus, Prisma } from "@prisma/client";
import { hashPassword } from "../utils/password";
import { z } from "zod";
import { createAuditLog } from "../utils/audit";
import multer from "multer";
import { parse } from "csv-parse";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getFeatureFlag, setFeatureFlag } from "../utils/featureFlags";

const upload = multer({ dest: path.join(process.cwd(), "uploads") });

const router = Router();

router.use(authorize(Role.supervisor));

const teacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  displayColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
});

router.post("/teachers", async (req, res, next) => {
  try {
    const parsed = teacherSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }

    const { name, email, password, displayColor } = parsed.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        role: Role.teacher,
        name,
        email,
        passwordHash,
        teacher: {
          create: {
            displayColor,
          },
        },
      },
      include: { teacher: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "create",
      entity: "teacher",
      entityId: user.id,
      meta: { displayColor },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/teachers", async (_req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
      },
    });
    res.json(teachers);
  } catch (error) {
    next(error);
  }
});

router.patch("/teachers/:id", async (req, res, next) => {
  try {
    const partialSchema = teacherSchema.partial().omit({ password: true });
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }

    const { id } = req.params;
    const data: Prisma.TeacherUpdateInput = {};
    if (parsed.data.displayColor !== undefined) {
      data.displayColor = parsed.data.displayColor;
    }
    const userUpdate: Prisma.UserUpdateInput = {};
    if (parsed.data.name !== undefined) {
      userUpdate.name = parsed.data.name;
    }
    if (parsed.data.email !== undefined) {
      userUpdate.email = parsed.data.email;
    }
    if (Object.keys(userUpdate).length > 0) {
      data.user = { update: userUpdate };
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data,
      include: { user: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "update",
      entity: "teacher",
      entityId: id,
      meta: parsed.data,
    });

    res.json(teacher);
  } catch (error) {
    next(error);
  }
});

router.delete("/teachers/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.teacher.delete({ where: { id } });
    await prisma.user.delete({ where: { id } });
    await createAuditLog({
      userId: req.user!.id,
      action: "delete",
      entity: "teacher",
      entityId: id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

const studentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  studentNo: z.string(),
  guardianContact: z.string().optional(),
});

router.post("/students", async (req, res, next) => {
  try {
    const parsed = studentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const { name, email, password, studentNo, guardianContact } = parsed.data;
    const passwordHash = await hashPassword(password);

    const student = await prisma.user.create({
      data: {
        role: Role.student,
        name,
        email,
        passwordHash,
        student: {
          create: {
            studentNo,
            guardianContact: guardianContact ?? null,
          },
        },
      },
      include: { student: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "create",
      entity: "student",
      entityId: student.id,
    });

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

router.post("/students/bulk", upload.single("file"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "common.errors.unexpected", details: "file_missing" });
  }

  const filePath = req.file.path;
  const failures: Array<{ row: number; error: string }> = [];
  const created: string[] = [];

  try {
    let row = 0;
    const parser = createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true }));

    for await (const record of parser) {
      row += 1;
      try {
        const parsed = studentSchema.safeParse({
          name: record.name,
          email: record.email,
          password: record.password ?? "Ögrenci123",
          studentNo: record.student_no ?? record.studentNo,
          guardianContact: record.guardian_contact ?? undefined,
        });
        if (!parsed.success) {
          failures.push({ row, error: JSON.stringify(parsed.error.flatten()) });
          continue;
        }
        const { name, email, password, studentNo, guardianContact } = parsed.data;
        const passwordHash = await hashPassword(password);
        const student = await prisma.user.create({
          data: {
            role: Role.student,
            name,
            email,
            passwordHash,
            student: {
              create: {
                studentNo,
                guardianContact: guardianContact ?? null,
              },
            },
          },
        });
        created.push(student.id);
      } catch (error: any) {
        failures.push({ row, error: error.message });
      }
    }

    res.json({ createdCount: created.length, failures });
  } catch (error) {
    next(error);
  } finally {
    await unlink(filePath).catch(() => undefined);
  }
});

router.get("/students", async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ include: { user: true, classEnrollments: true } });
    res.json(students);
  } catch (error) {
    next(error);
  }
});

router.patch("/students/:id", async (req, res, next) => {
  try {
    const parsed = studentSchema.partial().omit({ password: true }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }

    const { id } = req.params;
    const studentUpdate: Prisma.StudentUpdateInput = {};
    if (parsed.data.studentNo !== undefined) {
      studentUpdate.studentNo = parsed.data.studentNo;
    }
    if (parsed.data.guardianContact !== undefined) {
      studentUpdate.guardianContact = parsed.data.guardianContact ?? null;
    }
    const userUpdate: Prisma.UserUpdateInput = {};
    if (parsed.data.name !== undefined) {
      userUpdate.name = parsed.data.name;
    }
    if (parsed.data.email !== undefined) {
      userUpdate.email = parsed.data.email;
    }
    if (Object.keys(userUpdate).length > 0) {
      studentUpdate.user = { update: userUpdate };
    }

    const student = await prisma.student.update({
      where: { id },
      data: studentUpdate,
      include: { user: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "update",
      entity: "student",
      entityId: id,
    });

    res.json(student);
  } catch (error) {
    next(error);
  }
});

router.delete("/students/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    await prisma.user.delete({ where: { id } });
    await createAuditLog({
      userId: req.user!.id,
      action: "delete",
      entity: "student",
      entityId: id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

const classSchema = z.object({
  name: z.string(),
  grade: z.number().int(),
  branch: z.string(),
});

router.post("/classes", async (req, res, next) => {
  try {
    const parsed = classSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const klass = await prisma.class.create({
      data: {
        ...parsed.data,
        createdBy: req.user!.id,
      },
    });
    await createAuditLog({
      userId: req.user!.id,
      action: "create",
      entity: "class",
      entityId: klass.id,
    });
    res.status(201).json(klass);
  } catch (error) {
    next(error);
  }
});

router.get("/classes", async (_req, res, next) => {
  try {
    const classes = await prisma.class.findMany({ include: { courses: true, students: true } });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

const courseSchema = z.object({
  classId: z.string(),
  name: z.string(),
  code: z.string(),
  teacherId: z.string(),
  weeklyHours: z.number().int().min(1),
});

router.post("/courses", async (req, res, next) => {
  try {
    const parsed = courseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const course = await prisma.course.create({ data: parsed.data });
    await createAuditLog({
      userId: req.user!.id,
      action: "create",
      entity: "course",
      entityId: course.id,
    });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
});

router.get("/courses", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({ include: { teacher: { include: { user: true } }, class: true } });
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

const termSchema = z.object({
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  absenceThresholdPercent: z.number().int().min(0).max(100).optional(),
});

router.post("/terms", async (req, res, next) => {
  try {
    const parsed = termSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const term = await prisma.term.create({
      data: {
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        absenceThresholdPercent: parsed.data.absenceThresholdPercent ?? 30,
      },
    });
    await createAuditLog({
      userId: req.user!.id,
      action: "create",
      entity: "term",
      entityId: term.id,
    });
    res.status(201).json(term);
  } catch (error) {
    next(error);
  }
});

router.patch("/terms/:id", async (req, res, next) => {
  try {
    const parsed = termSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const { id } = req.params;
    const termData: Prisma.TermUpdateInput = {};
    if (parsed.data.name !== undefined) {
      termData.name = parsed.data.name;
    }
    if (parsed.data.startDate !== undefined) {
      termData.startDate = new Date(parsed.data.startDate);
    }
    if (parsed.data.endDate !== undefined) {
      termData.endDate = new Date(parsed.data.endDate);
    }
    if (parsed.data.absenceThresholdPercent !== undefined) {
      termData.absenceThresholdPercent = parsed.data.absenceThresholdPercent;
    }
    const term = await prisma.term.update({
      where: { id },
      data: termData,
    });
    await createAuditLog({
      userId: req.user!.id,
      action: "update",
      entity: "term",
      entityId: id,
    });
    res.json(term);
  } catch (error) {
    next(error);
  }
});

router.get("/terms", async (_req, res, next) => {
  try {
    const terms = await prisma.term.findMany();
    res.json(terms);
  } catch (error) {
    next(error);
  }
});

const sessionSchema = z.object({
  courseId: z.string(),
  termId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

router.post("/schedule-sessions", async (req, res, next) => {
  try {
    const parsed = sessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const session = await prisma.scheduleSession.create({
      data: {
        courseId: parsed.data.courseId,
        termId: parsed.data.termId,
        date: new Date(parsed.data.date),
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      },
    });
    await createAuditLog({
      userId: req.user!.id,
      action: "create",
      entity: "scheduleSession",
      entityId: session.id,
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

router.get("/reports/attendance", async (req, res, next) => {
  try {
    const { classId, courseId, from, to, format } = req.query;
    const where: Prisma.ScheduleSessionWhereInput = {};
    if (courseId) {
      where.courseId = String(courseId);
    }
    if (classId) {
      where.course = {
        is: {
          classId: String(classId),
        },
      };
    }
    if (from || to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (from) {
        dateFilter.gte = new Date(String(from));
      }
      if (to) {
        dateFilter.lte = new Date(String(to));
      }
      where.date = dateFilter;
    }

    const sessions = await prisma.scheduleSession.findMany({
      where,
      include: {
        course: true,
        attendances: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const threshold = await prisma.term.findMany();
    const defaultThreshold = threshold[0]?.absenceThresholdPercent ?? 30;
    const countExcused = await getFeatureFlag("attendance.countExcused", true);

    const rows = sessions.flatMap((session) =>
      session.attendances.map((attendance) => {
        return {
          course: session.course.name,
          student: attendance.student.user.name,
          status: attendance.status,
          date: session.date.toISOString(),
        };
      })
    );

    if (format === "csv") {
      const header = "course,student,status,date\n";
      const content =
        header +
        rows
          .map((row) => `${row.course},${row.student},${row.status},${row.date}`)
          .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=attendance.csv");
      return res.send(content);
    }

    const grouped = sessions.reduce<Record<string, { total: number; absences: number }>>((acc, session) => {
      for (const attendance of session.attendances) {
        const key = `${attendance.studentId}-${session.courseId}`;
        const current = acc[key] ?? { total: 0, absences: 0 };
        current.total += 1;
        if (attendance.status === AttendanceStatus.unexcused || (attendance.status === AttendanceStatus.excused && countExcused)) {
          current.absences += 1;
        }
        acc[key] = current;
      }
      return acc;
    }, {});

    const summary = Object.entries(grouped).map(([key, value]) => {
      const [studentId, courseIdKey] = key.split("-");
      return {
        studentId,
        courseId: courseIdKey,
        percent: Math.round((value.absences / value.total) * 1000) / 10,
        threshold: defaultThreshold,
      };
    });

    res.json({ rows, summary });
  } catch (error) {
    next(error);
  }
});

router.get("/feature-flags", async (_req, res, next) => {
  try {
    const flags = await prisma.featureFlag.findMany();
    res.json(flags);
  } catch (error) {
    next(error);
  }
});

router.post("/feature-flags", async (req, res, next) => {
  try {
    const schema = z.object({ key: z.string(), value: z.any() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const flag = await setFeatureFlag(parsed.data.key, parsed.data.value);
    await createAuditLog({
      userId: req.user!.id,
      action: "upsert",
      entity: "featureFlag",
      entityId: parsed.data.key,
      meta: parsed.data,
    });
    res.status(201).json(flag);
  } catch (error) {
    next(error);
  }
});

export default router;
