import pino from 'pino';
import { env } from '../config/env';
import { en } from 'zod/v4/locales';

export const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
    env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {colorize:true,translateTime: 'SYS:standard'},        
    } :
    undefined,
});
