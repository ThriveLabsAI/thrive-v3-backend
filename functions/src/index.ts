import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { loggingMiddleware } from './middleware/logging';
import { validateAuth } from './middleware/validation';
import { health } from './endpoints/health';

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();

// Middleware
app.use(express.json());
app.use(loggingMiddleware);

// Public routes
app.get('/v3/health', health);

// Protected routes (require auth)
app.use(validateAuth);

// Future protected endpoints will be added here:
// app.post('/v3/generateBlueprint', generateBlueprint);
// app.post('/v3/generateDailyGuidance', generateDailyGuidance);
// app.post('/v3/sendChatMessage', sendChatMessage);
// etc.

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
  ],
}));
