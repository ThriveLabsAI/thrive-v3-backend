import { Request, Response } from 'express';
import { DailyGuidanceRequestSchema, DailyGuidanceResponseSchema } from '../schemas/responses';
import { generateDailyGuidance } from '../utils/ai';
import { writeDailyGuidance, getUserBlueprint } from '../utils/firestore';

export async function generateDailyGuidanceHandler(req: Request, res: Response): Promise<void> {
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

    // Validate request
    const validated = DailyGuidanceRequestSchema.parse(req.body);
    const uid = req.user.uid;
    const date = validated.date || new Date().toISOString().split('T')[0];

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'generating_daily_guidance',
      uidHash: req.metadata?.uidHash,
    }));

    // Load user's blueprint for context
    const blueprint = await getUserBlueprint(uid);
    const blueprintSummary = blueprint?.summary;
    const focusAreas = blueprint?.focusAreas;
    const tonePref = blueprint?.tonePreference;

    // Generate guidance via AI
    const guidance = await generateDailyGuidance(blueprintSummary, focusAreas, tonePref);

    const response = {
      message: guidance.message,
      affirmation: guidance.affirmation,
      action: guidance.action,
      patternToWatch: guidance.patternToWatch,
      strengthToUse: guidance.strengthToUse,
      mission: guidance.mission,
      generatedAt: new Date().toISOString(),
    };

    // Validate response
    const validatedResponse = DailyGuidanceResponseSchema.parse(response);

    // Write to Firestore
    await writeDailyGuidance(uid, date, validatedResponse);

    res.status(200).json(validatedResponse);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'daily_guidance_generated',
      uidHash: req.metadata?.uidHash,
      date,
      hasMission: !!validatedResponse.mission,
    }));
  } catch (error) {
    console.error('Daily guidance error:', error);

    // Determine error code and message
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        errorCode = 'AI_CONFIG_ERROR';
        statusCode = 503;
        errorMessage = 'AI service not configured';
      } else if (error.message.includes('OpenAI API error')) {
        errorCode = 'AI_SERVICE_ERROR';
        statusCode = 503;
        errorMessage = 'AI service unavailable';
      } else if (error.message.includes('validation')) {
        errorCode = 'VALIDATION_ERROR';
        statusCode = 400;
        errorMessage = 'Invalid request';
      }
    }

    res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
    });
  }
}
