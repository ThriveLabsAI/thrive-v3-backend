import { Request, Response } from 'express';
import { ChatMemoryRequestSchema, ChatMemoryResponseSchema } from '../schemas/responses';
import { updateChatMemory } from '../utils/firestore';

export async function summarizeChatMemoryHandler(req: Request, res: Response): Promise<void> {
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
    const validated = ChatMemoryRequestSchema.parse(req.body);
    const uid = req.user.uid;

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'summarizing_chat_memory',
      uidHash: req.metadata?.uidHash,
      sessionId: validated.sessionId,
    }));

    // Update chat memory document
    const memoryData = {
      lastThemes: validated.lastThemes || [],
      unresolvedTopic: validated.unresolvedTopic,
      recentEmotionalState: validated.recentEmotionalState,
    };

    await updateChatMemory(uid, memoryData);

    const response = {
      uid,
      lastThemes: memoryData.lastThemes,
      unresolvedTopic: memoryData.unresolvedTopic,
      recentEmotionalState: memoryData.recentEmotionalState,
      lastUpdatedAt: new Date().toISOString(),
    };

    // Validate response
    const validatedResponse = ChatMemoryResponseSchema.parse(response);

    res.status(200).json(validatedResponse);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'chat_memory_updated',
      uidHash: req.metadata?.uidHash,
      themeCount: memoryData.lastThemes.length,
    }));
  } catch (error) {
    console.error('Memory summarization error:', error);

    // Determine error code and message
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('validation')) {
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
