import { Router } from "express";
import { authorize } from "../middleware/auth";
import { Role, AttendanceStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getFeatureFlag } from "../utils/featureFlags";

const router = Router();
router.use(authorize(Role.student));

router.get("/courses", async (req, res, next) => {
  try {
    const courses = await prisma.classStudent.findMany({
      where: { studentId: req.user!.id, isActive: true },
      include: {
        class: {
          include: {
            courses: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    res.json(
      courses.flatMap((enrollment) =>
        enrollment.class.courses.map((course) => ({
          id: course.id,
          name: course.name,
          code: course.code,
          teacherColor: course.teacher.displayColor,
          teacherName: course.teacher.user.name,
        }))
      )
    );
  } catch (error) {
    next(error);
  }
});

router.get("/courses/:id/attendance-summary", async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id }, include: { sessions: true, teacher: true } });
    if (!course) {
      return res.status(404).json({ message: "common.errors.unexpected" });
    }
    const isEnrolled = await prisma.classStudent.findFirst({
      where: {
        classId: course.classId,
        studentId: req.user!.id,
        isActive: true,
      },
    });
    if (!isEnrolled) {
      return res.status(403).json({ message: "auth.errors.unauthorized" });
    }

    const attendances = await prisma.attendance.findMany({
      where: { studentId: req.user!.id, scheduleSession: { courseId: course.id } },
      include: { scheduleSession: true },
    });

    const countExcused = await getFeatureFlag("attendance.countExcused", true);
    const totalSessions = await prisma.scheduleSession.count({ where: { courseId: course.id } });
    const absences = attendances.filter((attendance) =>
      attendance.status === AttendanceStatus.unexcused || (countExcused && attendance.status === AttendanceStatus.excused)
    ).length;
    const percent = totalSessions === 0 ? 0 : Math.round((absences / totalSessions) * 1000) / 10;

    res.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        teacherColor: course.teacher.displayColor,
      },
      percent,
      totalSessions,
      absences,
      history: attendances.map((attendance) => ({
        date: attendance.scheduleSession.date,
        status: attendance.status,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

export default router;
