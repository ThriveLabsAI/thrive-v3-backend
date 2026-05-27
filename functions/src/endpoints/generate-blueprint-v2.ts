import { Request, Response } from 'express';
import { BlueprintRequestSchema, BlueprintResponseSchema } from '../schemas/responses';
import { generateBlueprint } from '../utils/ai';
import { writeBlueprint } from '../utils/firestore';
import { getSefarYetzirahInsight } from '../utils/sefer-yetzirah';

export async function generateBlueprintHandler(req: Request, res: Response): Promise<void> {
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
    const validated = BlueprintRequestSchema.parse(req.body);
    const uid = req.user.uid;

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'generating_blueprint',
      uidHash: req.metadata?.uidHash,
    }));

    // Get Sefer Yetzirah insights from birthdate
    const syInsight = getSefarYetzirahInsight(validated.birthdate);
    const syText = syInsight ? `${syInsight.zodiac} (${syInsight.letter}): ${syInsight.insight}` : undefined;

    // Generate blueprint via AI
    const blueprint = await generateBlueprint(
      validated.name,
      validated.focusAreas,
      validated.emotionalGoal,
      syText
    );

    const response = {
      ...blueprint,
      generatedAt: new Date().toISOString(),
    };

    // Validate response
    const validatedResponse = BlueprintResponseSchema.parse(response);

    // Write to Firestore
    await writeBlueprint(uid, {
      ...validatedResponse,
      birthdate: validated.birthdate,
      focusAreas: validated.focusAreas,
      tonePreference: validated.tonePreference,
    });

    res.status(200).json(validatedResponse);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'blueprint_generated',
      uidHash: req.metadata?.uidHash,
      sectionsCount: validatedResponse.sections.length,
      sydiac: syInsight?.zodiac,
    }));
  } catch (error) {
    console.error('Blueprint generation error:', error);

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
