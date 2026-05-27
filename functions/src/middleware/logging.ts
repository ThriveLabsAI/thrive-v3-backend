import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface RequestMetadata {
  requestId: string;
  uid?: string;
  uidHash?: string;
  startTime: number;
  method: string;
  path: string;
}

// Attach request metadata to Express Request object
declare global {
  namespace Express {
    interface Request {
      metadata?: RequestMetadata;
    }
  }
}

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  const startTime = Date.now();
  const uid = req.headers['x-user-id'] as string | undefined;

  // Hash uid for privacy (never log raw uid)
  const uidHash = uid ? crypto.createHash('sha256').update(uid).digest('hex').substring(0, 8) : undefined;

  req.metadata = {
    requestId,
    uid,
    uidHash,
    startTime,
    method: req.method,
    path: req.path,
  };

  // Log request
  console.log(JSON.stringify({
    level: 'INFO',
    timestamp: new Date().toISOString(),
    requestId,
    event: 'request_received',
    method: req.method,
    path: req.path,
    uidHash,
  }));

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId,
      event: 'request_completed',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      uidHash,
    }));

    return originalSend.call(this, data);
  };

  next();
}

export function errorLogger(error: Error, requestId: string, uid?: string): void {
  const uidHash = uid ? crypto.createHash('sha256').update(uid).digest('hex').substring(0, 8) : undefined;

  console.error(JSON.stringify({
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    requestId,
    event: 'function_error',
    error: error.message,
    stack: error.stack,
    uidHash,
  }));
}
