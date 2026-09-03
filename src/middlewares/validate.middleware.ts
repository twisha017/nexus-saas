import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validate = (schema: ZodTypeAny): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Safely replace validated body data
      if (parsed && typeof parsed === 'object' && 'body' in parsed && parsed.body) {
        req.body = parsed.body;
      }

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          issues: error.issues.map((issue) => ({
            field: issue.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      next(error);
    }
  };
};