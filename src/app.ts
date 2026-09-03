import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { prisma } from './db/prisma';
import { taskRoutes } from './modules/tasks/task.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);
app.use('/api/v1/tasks', taskRoutes);
app.use(errorHandler);

app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    // Ping PostgreSQL with a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

export default app;