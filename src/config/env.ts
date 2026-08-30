import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV : z.enum(['development','test','production']).default('development'),
    PORT: z.string().default('4000').transform(Number),
    CORS_ORIGIN: z.string().default('*'),
    DATABASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);