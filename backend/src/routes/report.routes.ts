import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../services/prisma.js';
import { ApiError } from '../middlewares/errorHandlers.js';
import PDFDocument from 'pdfkit';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /reports/attendance:
 *   get:
 *     summary: Devamsızlık raporu üretir (JSON/CSV/PDF)
 *     tags:
 *       - Reports
 */
router.get(
  '/attendance',
  asyncHandler(async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const format = String(req.query.format ?? 'json');

    if (req.user!.role === 'teacher') {
      if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.teacherId !== req.user!.id) {
          throw new ApiError(403, 'Bu raporu görüntüleme yetkiniz yok');
        }
      }
    }

    const courseFilter = courseId ? { id: courseId } : classId ? { classId } : {};

    const courses = await prisma.course.findMany({
      where: {
        ...courseFilter,
        ...(req.user!.role === 'teacher' && { teacherId: req.user!.id })
      },
      include: {
        class: true,
        teacher: {
          include: { user: true }
        },
        sessions: {
          where: {
            ...(from && { startTime: { gte: from } }),
            ...(to && { endTime: { lte: to } })
          },
          include: {
            attendances: {
              include: {
                student: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    const rows: Array<{ courseName: string; studentName: string; studentNo: string; status: string; date: string } | null> = [];
    const aggregates: Record<number, { total: number; absent: number; excused: number; unexcused: number }> = {};

    courses.forEach((course) => {
      course.sessions.forEach((session) => {
        session.attendances.forEach((attendance) => {
          const student = attendance.student;
          rows.push({
            courseName: course.name,
            studentName: student.user.name,
            studentNo: student.studentNo,
            status: attendance.status,
            date: session.startTime.toISOString()
          });
          const stats = aggregates[student.id] ?? { total: 0, absent: 0, excused: 0, unexcused: 0 };
          stats.total += 1;
          if (attendance.status === 'excused') {
            stats.absent += 1;
            stats.excused += 1;
          } else if (attendance.status === 'unexcused') {
            stats.absent += 1;
            stats.unexcused += 1;
          }
          aggregates[student.id] = stats;
        });
      });
    });

    if (format === 'csv') {
      const header = 'course,student_name,student_no,status,date\n';
      const csvBody = rows
        .map((row) => `${row?.courseName},${row?.studentName},${row?.studentNo},${row?.status},${row?.date}`)
        .join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.send(header + csvBody);
      return;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Yoklama Raporu', { align: 'center' });
      doc.moveDown();

      rows.forEach((row) => {
        if (!row) return;
        doc
          .fontSize(10)
          .text(
            `${row.courseName} | ${row.studentName} (${row.studentNo}) | ${row.status} | ${new Date(row.date).toLocaleString('tr-TR')}`
          );
      });

      doc.end();
      return;
    }

    res.json({ courses, rows, aggregates });
  })
);

export default router;
