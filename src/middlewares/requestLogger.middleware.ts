import { Request, Response, NextFunction } from "express";
import {randomUUID} from 'crypto';
import { logger } from '../utils/logger';

export const requestLogger = (req:Request, res: Response, next: NextFunction) =>{
    const reqId = randomUUID();;
    req.headers['x-request-id'] = reqId;
    res.setHeader('x-request-id',reqId);

    const start = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - start;
        logger.info({
            requestID: reqId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs,
        });
    });

    next();

};
