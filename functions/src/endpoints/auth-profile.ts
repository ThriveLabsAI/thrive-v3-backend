import { Request, Response } from 'express';
import { AuthProfileResponseSchema } from '../schemas/responses';
import { getUserProfile } from '../utils/firestore';

export async function authProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.uid) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'AUTH_MISSING',
        requestId: req.metadata?.requestId || 'unknown',
        timestamp: Date.now(),
      });
      return;
    }

    const uid = req.user.uid;
    const userProfile = await getUserProfile(uid);

    const response = {
      uid,
      email: req.user.email,
      createdAt: userProfile?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastSignIn: userProfile?.lastSignIn?.toDate?.()?.toISOString(),
    };

    // Validate response
    const validated = AuthProfileResponseSchema.parse(response);

    res.status(200).json(validated);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'auth_profile_retrieved',
      uidHash: req.metadata?.uidHash,
    }));
  } catch (error) {
    console.error('Auth profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
    });
  }
}
