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
    const now = new Date();
    const memoryData: Record<string, any> = {
      lastThemes: validated.lastThemes || [],
    };
    if (validated.unresolvedTopic !== undefined) {
      memoryData.unresolvedTopic = validated.unresolvedTopic;
    }
    if (validated.recentEmotionalState !== undefined) {
      memoryData.recentEmotionalState = validated.recentEmotionalState;
    }

    await updateChatMemory(uid, memoryData);

    // Build response with ISO timestamp (Firestore write uses serverTimestamp)
    const response: Record<string, any> = {
      uid,
      lastThemes: memoryData.lastThemes,
      lastUpdatedAt: now.toISOString(),
    };
    if (memoryData.unresolvedTopic) {
      response.unresolvedTopic = memoryData.unresolvedTopic;
    }
    if (memoryData.recentEmotionalState) {
      response.recentEmotionalState = memoryData.recentEmotionalState;
    }

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

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }

    // Determine error code and message
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        errorCode = 'VALIDATION_ERROR';
        statusCode = 400;
        errorMessage = 'Invalid request';
      } else if (error.message.includes('Firestore')) {
        errorCode = 'FIRESTORE_ERROR';
        statusCode = 500;
        errorMessage = 'Database operation failed';
      }
    }

    res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
      debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined,
    });
  }
}
