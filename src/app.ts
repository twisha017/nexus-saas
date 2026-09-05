import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { prisma } from './db/prisma';
import { taskRoutes } from './modules/tasks/task.routes';
import { errorHandler } from './middlewares/error.middleware';
import workspaceRoutes from './modules/workspaces/workspace.routes'; // 1. Import Workspace routes

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);
app.use('/api/v1/tasks', taskRoutes);
app.use(errorHandler);
app.use('/api/v1/workspaces', workspaceRoutes); // 2. Mount workspace routes here

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

export default app;