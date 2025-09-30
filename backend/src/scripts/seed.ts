import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

async function main() {
  console.log('Seeding database...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.scheduleSession.deleteMany();
  await prisma.course.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.term.deleteMany();

  const supervisorPassword = await bcrypt.hash('Supervisor123', 10);
  const supervisor = await prisma.user.create({
    data: {
      name: 'Süper Viser',
      email: 'supervisor@example.com',
      passwordHash: supervisorPassword,
      role: 'supervisor',
    },
  });

  const teacherPassword = await bcrypt.hash('Teacher123', 10);
  const teacherUser = await prisma.user.create({
    data: {
      name: 'Öğretmen Ayşe',
      email: 'teacher@example.com',
      passwordHash: teacherPassword,
      role: 'teacher',
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      id: teacherUser.id,
      displayColor: '#1E88E5',
    },
  });

  const studentPassword = await bcrypt.hash('Student123', 10);
  const studentUser = await prisma.user.create({
    data: {
      name: 'Öğrenci Can',
      email: 'student@example.com',
      passwordHash: studentPassword,
      role: 'student',
    },
  });

  const student = await prisma.student.create({
    data: {
      id: studentUser.id,
      studentNo: '2024001',
    },
  });

  const klass = await prisma.class.create({
    data: {
      name: '10 Fen',
      grade: '10',
      branch: 'Fen',
      createdBy: supervisor.id,
    },
  });

  await prisma.classStudent.create({
    data: {
      classId: klass.id,
      studentId: student.id,
    },
  });

  const term = await prisma.term.create({
    data: {
      name: '2024-2025 Güz',
      startDate: new Date('2024-09-01T07:00:00Z'),
      endDate: new Date('2025-01-15T07:00:00Z'),
      absenceThresholdPercent: 30,
    },
  });

  const course = await prisma.course.create({
    data: {
      classId: klass.id,
      name: 'Fizik',
      code: 'FZK101',
      teacherId: teacher.id,
      weeklyHours: 4,
    },
  });

  const sessionDates = [
    new Date('2024-10-01T07:30:00Z'),
    new Date('2024-10-08T07:30:00Z'),
    new Date('2024-10-15T07:30:00Z'),
  ];

  for (const date of sessionDates) {
    await prisma.scheduleSession.create({
      data: {
        courseId: course.id,
        termId: term.id,
        date,
        startTime: date,
        endTime: new Date(date.getTime() + 45 * 60000),
        teacherId: teacher.id,
      },
    });
  }

  console.log('Seed tamamlandı.');
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
