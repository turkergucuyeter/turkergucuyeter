import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@okul.local' },
    update: {},
    create: {
      name: 'Süper Yönetici',
      email: 'supervisor@okul.local',
      passwordHash: password,
      role: 'supervisor'
    }
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'ogretmen@okul.local' },
    update: {},
    create: {
      name: 'Ayşe Öğretmen',
      email: 'ogretmen@okul.local',
      passwordHash: password,
      role: 'teacher'
    }
  });

  await prisma.teacher.upsert({
    where: { id: teacherUser.id },
    update: { displayColor: '#7C3AED' },
    create: {
      id: teacherUser.id,
      displayColor: '#7C3AED'
    }
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'ogrenci@okul.local' },
    update: {},
    create: {
      name: 'Ali Öğrenci',
      email: 'ogrenci@okul.local',
      passwordHash: password,
      role: 'student'
    }
  });

  await prisma.student.upsert({
    where: { id: studentUser.id },
    update: { studentNo: '1001', guardianContact: 'veli@example.com' },
    create: {
      id: studentUser.id,
      studentNo: '1001',
      guardianContact: 'veli@example.com'
    }
  });

  const classroom = await prisma.class.upsert({
    where: { code: '9A' },
    update: {},
    create: {
      name: '9-A Sınıfı',
      code: '9A',
      grade: '9',
      branch: 'A',
      createdBy: supervisor.id
    }
  });

  await prisma.classStudent.upsert({
    where: {
      classId_studentId: {
        classId: classroom.id,
        studentId: studentUser.id
      }
    },
    update: {},
    create: {
      classId: classroom.id,
      studentId: studentUser.id
    }
  });

  const term = await prisma.term.upsert({
    where: { name: '2024-2025 Güz' },
    update: {},
    create: {
      name: '2024-2025 Güz',
      startDate: new Date('2024-09-09T00:00:00Z'),
      endDate: new Date('2025-01-15T00:00:00Z'),
      absenceThresholdPercent: 30
    }
  });

  const course = await prisma.course.upsert({
    where: { code: 'MAT101' },
    update: {},
    create: {
      name: 'Matematik',
      code: 'MAT101',
      classId: classroom.id,
      teacherId: teacherUser.id,
      weeklyHours: 5
    }
  });

  const today = new Date();
  const sessionsData = Array.from({ length: 3 }).map((_, index) => {
    const start = new Date(today);
    start.setDate(start.getDate() + index);
    start.setHours(8, 0, 0, 0);
    const end = new Date(start);
    end.setHours(8, 45, 0, 0);
    return {
      courseId: course.id,
      termId: term.id,
      date: start,
      startTime: start,
      endTime: end
    };
  });

  await prisma.scheduleSession.createMany({ data: sessionsData, skipDuplicates: true });

  await prisma.featureFlag.upsert({
    where: { key: 'only_unexcused_counts' },
    update: { valueJson: JSON.stringify(false) },
    create: { key: 'only_unexcused_counts', valueJson: JSON.stringify(false) }
  });

  await prisma.featureFlag.upsert({
    where: { key: 'grace_period_minutes' },
    update: { valueJson: JSON.stringify(10) },
    create: { key: 'grace_period_minutes', valueJson: JSON.stringify(10) }
  });

  await prisma.featureFlag.upsert({
    where: { key: 'web_push_enabled' },
    update: { valueJson: JSON.stringify(false) },
    create: { key: 'web_push_enabled', valueJson: JSON.stringify(false) }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
