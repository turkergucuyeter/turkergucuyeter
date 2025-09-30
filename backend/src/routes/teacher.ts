import { Router } from "express";
import { authorize } from "../middleware/auth";
import { Role, AttendanceStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { env } from "../config/env";
import { z } from "zod";
import { createAuditLog } from "../utils/audit";
import { getFeatureFlag } from "../utils/featureFlags";
import { createNotification } from "../utils/notifications";
import { t } from "../utils/i18n";

dayjs.extend(utc);

const router = Router();
router.use(authorize(Role.teacher));

router.get("/courses", async (req, res, next) => {
  try {
    const classes = await prisma.course.findMany({
      where: { teacherId: req.user!.id },
      include: {
        class: true,
        teacher: true,
      },
    });

    const grouped: Record<
      string,
      {
        name: string;
        code: string | null;
        color: string;
        sections: Array<{ courseId: string; classId: string; className: string; weeklyHours: number | null }>;
      }
    > = {};

    for (const course of classes) {
      const key = `${course.name}__${course.code ?? ""}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: course.name,
          code: course.code,
          color: course.teacher.displayColor,
          sections: [],
        };
      }
      grouped[key]!.sections.push({
        courseId: course.id,
        classId: course.class.id,
        className: course.class.name,
        weeklyHours: course.weeklyHours,
      });
    }

    const response = Object.values(grouped)
      .map((group) => ({
        ...group,
        sections: group.sections.sort((a, b) => a.className.localeCompare(b.className, "tr")),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get("/courses/:courseId/sessions", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;
    const where: Prisma.ScheduleSessionWhereInput = {
      course: {
        is: {
          id: courseId,
          teacherId: req.user!.id,
        },
      },
    };
    if (date) {
      where.date = new Date(String(date));
    }

    const sessions = await prisma.scheduleSession.findMany({
      where,
      include: {
        course: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.get("/sessions/:id/attendance", async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await prisma.scheduleSession.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            class: {
              include: {
                students: {
                  include: {
                    student: {
                      include: {
                        user: true,
                      },
                    },
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
      return res.status(403).json({ message: "auth.errors.unauthorized" });
    }

    const response = session.course.class.students.map((enrollment) => {
      const attendance = session.attendances.find((a) => a.studentId === enrollment.studentId);
      return {
        studentId: enrollment.studentId,
        studentName: enrollment.student.user.name,
        status: attendance?.status ?? AttendanceStatus.present,
      };
    });

    const editable = ensureSessionEditable(session.startTime, session.endTime, session.isLocked);

    res.json({
      session: {
        id: session.id,
        course: {
          id: session.course.id,
          name: session.course.name,
          code: session.course.code,
          class: {
            id: session.course.class.id,
            name: session.course.class.name,
          },
        },
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        isLocked: session.isLocked,
        isEditable: editable,
        editableUntil: dayjs(session.endTime).utc().add(env.gracePeriodMinutes, "minute").toDate(),
      },
      attendances: response,
    });
  } catch (error) {
    next(error);
  }
});

const attendanceSchema = z.object({
  students: z.array(
    z.object({
      studentId: z.string(),
      status: z.nativeEnum(AttendanceStatus),
    })
  ),
});

const ensureSessionEditable = (start: Date, end: Date, isLocked: boolean) => {
  if (isLocked) {
    return false;
  }
  const now = dayjs().utc();
  const startUtc = dayjs(start).utc();
  const endUtc = dayjs(end).utc().add(env.gracePeriodMinutes, "minute");
  return now.isAfter(startUtc) && now.isBefore(endUtc);
};

const handleAttendanceUpsert = async (
  sessionId: string,
  teacherId: string,
  students: Array<{ studentId: string; status: AttendanceStatus }>
) => {
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      attendances: true,
      term: true,
    },
  });
  if (!session || session.course.teacherId !== teacherId) {
    throw Object.assign(new Error("auth.errors.unauthorized"), { status: 403 });
  }

  const editable = ensureSessionEditable(session.startTime, session.endTime, session.isLocked);
  if (!editable) {
    await prisma.scheduleSession.update({ where: { id: sessionId }, data: { isLocked: true } });
    throw Object.assign(new Error("attendance.cutoffReached"), { status: 400 });
  }

  for (const student of students) {
    const existing = session.attendances.find((a) => a.studentId === student.studentId);
    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: student.status,
          takenBy: teacherId,
          takenAt: new Date(),
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          scheduleSessionId: sessionId,
          studentId: student.studentId,
          status: student.status,
          takenBy: teacherId,
          takenAt: new Date(),
        },
      });
    }
  }

  await createAuditLog({
    userId: teacherId,
    action: "upsert",
    entity: "attendance",
    entityId: sessionId,
    meta: { students: students.length },
  });

  const countExcused = await getFeatureFlag("attendance.countExcused", true);

  const sessionWithAttendances = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
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

  if (sessionWithAttendances) {
    for (const attendance of sessionWithAttendances.attendances) {
      const totalSessions = await prisma.scheduleSession.count({ where: { courseId: sessionWithAttendances.courseId } });
      const absences = await prisma.attendance.count({
        where: {
          studentId: attendance.studentId,
          scheduleSession: { courseId: sessionWithAttendances.courseId },
          status: countExcused ? { in: [AttendanceStatus.excused, AttendanceStatus.unexcused] } : AttendanceStatus.unexcused,
        },
      });
      const percent = totalSessions === 0 ? 0 : Math.round((absences / totalSessions) * 1000) / 10;
      if (percent >= session.term.absenceThresholdPercent) {
        await createNotification({
          userId: attendance.studentId,
          title: t("notifications.thresholdReached"),
          body: t("notifications.thresholdBody", { course: session.course.name, percent }),
          allowWebPush: env.freeWebPush,
        });
      }
    }
  }
};

router.post("/sessions/:id/attendance", async (req, res, next) => {
  try {
    const parsed = attendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    await handleAttendanceUpsert(req.params.id, req.user!.id, parsed.data.students);
    res.status(201).json({ message: "attendance.saved" });
  } catch (error) {
    next(error);
  }
});

router.patch("/sessions/:id/attendance", async (req, res, next) => {
  try {
    const parsed = attendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    await handleAttendanceUpsert(req.params.id, req.user!.id, parsed.data.students);
    res.json({ message: "attendance.updated" });
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    const sessions = await prisma.scheduleSession.findMany({
      where: { course: { teacherId: req.user!.id } },
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

    const summary = sessions.map((session) => ({
      sessionId: session.id,
      courseName: session.course.name,
      date: session.date,
      attendances: session.attendances,
    }));

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;
