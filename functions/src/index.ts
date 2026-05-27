import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { loggingMiddleware } from './middleware/logging';
import { validateRequestBody } from './middleware/validation';
import { authMiddleware } from './utils/auth';
import { health } from './endpoints/health';
import { authProfile } from './endpoints/auth-profile';
import { generateDailyGuidanceHandler } from './endpoints/generate-daily-guidance-v2';
import { generateBlueprintHandler } from './endpoints/generate-blueprint-v2';
import { sendChatMessageHandler } from './endpoints/send-chat-message-v2';
import { summarizeChatMemoryHandler } from './endpoints/summarize-chat-memory';
import {
  DailyGuidanceRequestSchema,
  BlueprintRequestSchema,
  ChatMessageRequestSchema,
  ChatMemoryRequestSchema,
} from './schemas/responses';

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();

// Middleware
app.use(express.json());
app.use(loggingMiddleware);

// Public routes
app.get('/v3/health', health);

// Protected routes (require auth)
app.get('/v3/auth/profile', authMiddleware, authProfile);

app.post(
  '/v3/generateBlueprint',
  authMiddleware,
  validateRequestBody(BlueprintRequestSchema),
  generateBlueprintHandler
);

app.post(
  '/v3/generateDailyGuidance',
  authMiddleware,
  validateRequestBody(DailyGuidanceRequestSchema),
  generateDailyGuidanceHandler
);

app.post(
  '/v3/sendChatMessage',
  authMiddleware,
  validateRequestBody(ChatMessageRequestSchema),
  sendChatMessageHandler
);

app.post(
  '/v3/summarizeChatMemory',
  authMiddleware,
  validateRequestBody(ChatMemoryRequestSchema),
  summarizeChatMemoryHandler
);

// Error handler
app.use((err: Error, req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.metadata?.requestId || 'unknown',
    timestamp: Date.now(),
  });
});

// Export HTTP function
export const api = functions
  .region('us-central1')
  .https.onRequest(app);

// Config
console.log(JSON.stringify({
  level: 'INFO',
  event: 'functions_initialized',
  timestamp: new Date().toISOString(),
  region: 'us-central1',
  endpoints: [
    'GET /v3/health',
    'GET /v3/auth/profile',
    'POST /v3/generateBlueprint (birthdate required, includes Sefer Yetzirah insights)',
    'POST /v3/generateDailyGuidance (includes mission, patternToWatch, strengthToUse)',
    'POST /v3/sendChatMessage (context injection: blueprint, guidance, memory)',
    'POST /v3/summarizeChatMemory (new endpoint for memory updates)',
  ],
}));
