import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessageRequestSchema, ChatMessageResponseSchema } from '../schemas/responses';
import { generateChatReply } from '../utils/ai';
import { writeChatMessage, getOrCreateChatSession } from '../utils/firestore';

export async function sendChatMessageHandler(req: Request, res: Response): Promise<void> {
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
    const validated = ChatMessageRequestSchema.parse(req.body);
    const uid = req.user.uid;

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'chat_message_received',
      uidHash: req.metadata?.uidHash,
    }));

    // Get or create chat session
    const sessionId = validated.sessionId || (await getOrCreateChatSession(uid));

    // Store user message
    const userMessageId = uuidv4();
    const now = new Date().toISOString();

    await writeChatMessage(uid, sessionId, userMessageId, {
      role: 'user',
      content: validated.message,
      createdAt: now,
    });

    // Generate AI reply
    const reply = await generateChatReply(validated.message);

    // Store assistant message
    const assistantMessageId = uuidv4();
    const assistantCreatedAt = new Date().toISOString();

    await writeChatMessage(uid, sessionId, assistantMessageId, {
      role: 'assistant',
      content: reply,
      createdAt: assistantCreatedAt,
    });

    const response = {
      id: assistantMessageId,
      reply,
      createdAt: assistantCreatedAt,
    };

    // Validate response
    const validatedResponse = ChatMessageResponseSchema.parse(response);

    res.status(200).json(validatedResponse);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'chat_message_replied',
      uidHash: req.metadata?.uidHash,
      sessionId,
    }));
  } catch (error) {
    console.error('Chat message error:', error);

    // Determine error code and message
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('DEEPSEEK_API_KEY')) {
        errorCode = 'AI_CONFIG_ERROR';
        statusCode = 503;
        errorMessage = 'AI service not configured';
      } else if (error.message.includes('DeepSeek API error')) {
        errorCode = 'AI_SERVICE_ERROR';
        statusCode = 503;
        errorMessage = 'AI service unavailable';
      } else if (error.message.includes('Invalid request body')) {
        errorCode = 'VALIDATION_ERROR';
        statusCode = 400;
        errorMessage = 'Invalid request body';
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
