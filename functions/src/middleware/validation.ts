import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateRequestBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          requestId: req.metadata?.requestId || 'unknown',
          timestamp: Date.now(),
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: 'Validation error',
          code: 'INTERNAL_ERROR',
          requestId: req.metadata?.requestId || 'unknown',
          timestamp: Date.now(),
        });
      }
    }
  };
}

export function validateAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Missing or invalid authorization header',
      code: 'AUTH_ERROR',
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
    });
    return;
  }

  next();
}
