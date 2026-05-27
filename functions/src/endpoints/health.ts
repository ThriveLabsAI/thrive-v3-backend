import { Request, Response } from 'express';
import { HealthResponse, HealthResponseSchema } from '../schemas/responses';

const startTime = Date.now();

export async function health(req: Request, res: Response): Promise<void> {
  try {
    const uptime = Date.now() - startTime;

    const response: HealthResponse = {
      status: 'ok',
      timestamp: Date.now(),
      version: '0.1.0',
      uptime,
    };

    // Validate response against schema
    const validated = HealthResponseSchema.parse(response);

    res.status(200).json(validated);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId || 'unknown',
      event: 'health_check_success',
      uptime,
    }));
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
    });
  }
}
