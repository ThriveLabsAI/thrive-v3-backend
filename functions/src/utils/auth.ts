import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export async function verifyIdToken(token: string): Promise<{ uid: string; email?: string }> {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch (error) {
    throw new Error('Invalid or expired ID token');
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({
        error: 'Missing authorization token',
        code: 'AUTH_MISSING',
        requestId: req.metadata?.requestId || 'unknown',
        timestamp: Date.now(),
      });
      return;
    }

    const decoded = await verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid authorization token',
      code: 'AUTH_INVALID',
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
    });
  }
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email?: string };
    }
  }
}
