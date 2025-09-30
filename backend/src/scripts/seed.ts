import { prisma } from "../config/prisma";
import { hashPassword } from "../utils/password";
import dayjs from "dayjs";

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.scheduleSession.deleteMany();
  await prisma.course.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.class.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.term.deleteMany();
  await prisma.featureFlag.deleteMany();

  const supervisorPassword = await hashPassword("Supervisor123!");
  const teacherPassword = await hashPassword("Teacher123!");
  const studentPassword = await hashPassword("Student123!");

  const supervisor = await prisma.user.create({
    data: {
      name: "Sistem Yöneticisi",
      email: "supervisor@example.com",
      passwordHash: supervisorPassword,
      role: "supervisor",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: "Ayşe Öğretmen",
      email: "teacher@example.com",
      passwordHash: teacherPassword,
      role: "teacher",
      teacher: {
        create: {
          displayColor: "#3B82F6",
        },
      },
    },
    include: { teacher: true },
  });

  const student = await prisma.user.create({
    data: {
      name: "Ali Öğrenci",
      email: "student@example.com",
      passwordHash: studentPassword,
      role: "student",
      student: {
        create: {
          studentNo: "1001",
          guardianContact: "veli@example.com",
        },
      },
    },
    include: { student: true },
  });

  const klass = await prisma.class.create({
    data: {
      name: "10-A",
      grade: 10,
      branch: "A",
      createdBy: supervisor.id,
    },
  });

  await prisma.classStudent.create({
    data: {
      classId: klass.id,
      studentId: student.student!.id,
    },
  });

  const course = await prisma.course.create({
    data: {
      name: "Matematik",
      code: "MAT101",
      classId: klass.id,
      teacherId: teacher.teacher!.id,
      weeklyHours: 4,
    },
  });

  const term = await prisma.term.create({
    data: {
      name: "2024-2025 Güz",
      startDate: dayjs().startOf("month").toDate(),
      endDate: dayjs().add(4, "month").endOf("month").toDate(),
      absenceThresholdPercent: 30,
    },
  });

  for (let i = 0; i < 4; i++) {
    await prisma.scheduleSession.create({
      data: {
        courseId: course.id,
        termId: term.id,
        date: dayjs().add(i, "day").toDate(),
        startTime: dayjs().add(i, "day").hour(9).minute(0).toDate(),
        endTime: dayjs().add(i, "day").hour(10).minute(0).toDate(),
      },
    });
  }

  await prisma.featureFlag.create({
    data: {
      key: "attendance.countExcused",
      valueJson: true,
    },
  });

  console.log("Seed data created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
