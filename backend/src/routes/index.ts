import { Router } from 'express';
import { authRouter } from './auth';
import { supervisorRouter } from './supervisor';
import { teacherRouter } from './teacher';
import { studentRouter } from './student';
import { authenticate } from '../middleware/auth';
import { notificationRouter } from './notifications';

export const router = Router();

router.use('/auth', authRouter);
router.use('/notifications', authenticate, notificationRouter);
router.use('/supervisor', authenticate, supervisorRouter);
router.use('/teacher', authenticate, teacherRouter);
router.use('/student', authenticate, studentRouter);
