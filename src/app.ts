import express, {Application, Request, Response  } from "express";
import helmet  from "helmet";
import cors from 'cors';
import {env} from './config/env';
import { requestLogger } from "./middlewares/requestLogger.middleware";

const app: Application = express();

app.use(helmet());
app.use(cors({origin: env.CORS_ORIGIN}));
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) =>{
    res.status(200).json({
        status:'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
    });
});

export default app;