import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { json } from 'express';
import { router } from './routes';
import { env } from './config/env';
import swaggerDocument from './swagger.json';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', router);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});
