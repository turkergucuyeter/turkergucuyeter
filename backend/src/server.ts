import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandlers.js';
import authRouter from './routes/auth.routes.js';
import supervisorRouter from './routes/supervisor.routes.js';
import teacherRouter from './routes/teacher.routes.js';
import studentRouter from './routes/student.routes.js';
import notificationRouter from './routes/notification.routes.js';
import reportRouter from './routes/report.routes.js';
import featureFlagRouter from './routes/featureFlag.routes.js';
import pushRouter from './routes/push.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './utils/swagger.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map((item) => item.trim()),
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/auth', authRouter);
app.use('/supervisor', supervisorRouter);
app.use('/teacher', teacherRouter);
app.use('/student', studentRouter);
app.use('/notifications', notificationRouter);
app.use('/reports', reportRouter);
app.use('/feature-flags', featureFlagRouter);
app.use('/push', pushRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
