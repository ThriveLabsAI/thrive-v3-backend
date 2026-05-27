# Phase 2: Mobile Endpoints Documentation

**Status:** ✅ Built and ready for deployment

**Commit:** `37fc554`

**Deployment Token Required:** `firebase deploy --only functions --project thrive-8e99c --token "<token>"`

---

## 1. Endpoint Overview

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/v3/health` | GET | Public | Health check + uptime |
| `/v3/auth/profile` | GET | Bearer | Get user profile |
| `/v3/generateDailyGuidance` | POST | Bearer | Generate daily guidance via AI |
| `/v3/generateBlueprint` | POST | Bearer | Generate personal blueprint via AI |
| `/v3/sendChatMessage` | POST | Bearer | Send chat message + get AI reply |

---

## 2. Authentication

All protected endpoints require an **Authorization Bearer** header with a valid Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

**Verification:**
- Token is decoded via Firebase Admin SDK (`admin.auth().verifyIdToken()`)
- User UID is extracted and stored in `req.user.uid`
- Invalid/expired tokens return 401 Unauthorized

---

## 3. Endpoint Details

### GET /v3/health

**Status:** Public (no auth required)

**Request:**
```bash
curl -i https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": 1716806400000,
  "version": "0.1.0",
  "uptime": 45000
}
```

**Error (500):**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000
}
```

---

### GET /v3/auth/profile

**Status:** Protected (requires Bearer token)

**Request:**
```bash
curl -i -H "Authorization: Bearer <token>" \
  https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/auth/profile
```

**Response (200 OK):**
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "createdAt": "2026-05-27T16:02:00.000Z",
  "lastSignIn": "2026-05-27T16:05:30.000Z"
}
```

**Error (401 - Missing Token):**
```json
{
  "error": "Missing authorization token",
  "code": "AUTH_MISSING",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000
}
```

**Error (401 - Invalid Token):**
```json
{
  "error": "Invalid authorization token",
  "code": "AUTH_INVALID",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000
}
```

---

### POST /v3/generateDailyGuidance

**Status:** Protected (requires Bearer token)

**Request:**
```bash
curl -i -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "I am feeling stressed about work deadlines",
    "date": "2026-05-27"
  }' \
  https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/generateDailyGuidance
```

**Request Schema:**
```typescript
{
  context?: string;       // Optional context for AI generation
  date?: string;          // Optional ISO date (default: today)
}
```

**Response (200 OK):**
```json
{
  "message": "Take a moment to breathe and remember that challenges are opportunities for growth.",
  "affirmation": "I am capable of handling any obstacle that comes my way.",
  "action": "Set aside 10 minutes today for a quiet walk or meditation.",
  "generatedAt": "2026-05-27T16:02:00.000Z"
}
```

**Firestore Write:**
```
Collection: v3_daily_guidance/{uid}/days/{date}
Document:   2026-05-27
Data:       { message, affirmation, action, generatedAt, updatedAt }
```

**Error (503 - AI Service):**
```json
{
  "error": "AI service unavailable",
  "code": "AI_SERVICE_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000
}
```

**Error (503 - AI Config):**
```json
{
  "error": "AI service not configured",
  "code": "AI_CONFIG_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000
}
```

---

### POST /v3/generateBlueprint

**Status:** Protected (requires Bearer token)

**Request:**
```bash
curl -i -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "I want to build a healthier lifestyle and improve my career",
    "previousBlueprint": null
  }' \
  https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/generateBlueprint
```

**Request Schema:**
```typescript
{
  context?: string;              // Optional context for AI generation
  previousBlueprint?: any;       // Optional previous blueprint for improvement
}
```

**Response (200 OK):**
```json
{
  "title": "Health & Career Blueprint 2026",
  "summary": "A comprehensive plan for building sustainable health habits and advancing your career through deliberate growth and consistent action.",
  "sections": [
    {
      "title": "Health Foundation",
      "content": "Establish a morning routine including 30-minute workouts and nutritious meals. Track progress weekly."
    },
    {
      "title": "Career Development",
      "content": "Identify 3 key skills to develop. Complete one professional course monthly and seek mentorship."
    },
    {
      "title": "Daily Practices",
      "content": "Journal for 10 minutes, meditate for 5 minutes, and review goals at day's end."
    },
    {
      "title": "Milestone Checkpoints",
      "content": "Evaluate progress every 4 weeks. Adjust strategies based on what's working."
    }
  ],
  "generatedAt": "2026-05-27T16:02:00.000Z"
}
```

**Firestore Write:**
```
Collection: v3_blueprints/{uid}
Document:   {uid}
Data:       { title, summary, sections, generatedAt, updatedAt }
```

**Error Responses:** Same as `/v3/generateDailyGuidance`

---

### POST /v3/sendChatMessage

**Status:** Protected (requires Bearer token)

**Request:**
```bash
curl -i -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am struggling with work-life balance",
    "sessionId": "session_1716806400000"
  }' \
  https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/sendChatMessage
```

**Request Schema:**
```typescript
{
  message: string;         // Required user message
  sessionId?: string;      // Optional session ID (creates new if not provided)
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "reply": "Work-life balance is a journey, not a destination. Start by identifying one area where you can set a boundary this week. What matters most to you in your personal time?",
  "createdAt": "2026-05-27T16:02:00.000Z"
}
```

**Firestore Writes:**
```
1. User Message:
   Collection: v3_chat_sessions/{uid}/sessions/{sessionId}/messages/{messageId}
   Data:       { role: 'user', content, createdAt, updatedAt }

2. AI Reply:
   Collection: v3_chat_sessions/{uid}/sessions/{sessionId}/messages/{replyId}
   Data:       { role: 'assistant', content: reply, createdAt, updatedAt }

3. Session Created (if new):
   Collection: v3_chat_sessions/{uid}
   Data:       { currentSessionId, createdAt, updatedAt }
```

**Error (400 - Validation):**
```json
{
  "error": "Invalid request body",
  "code": "VALIDATION_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000,
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "message": "String must contain at least 1 character(s)",
      "path": ["message"]
    }
  ]
}
```

**Error Responses:** Same as `/v3/generateDailyGuidance` + validation errors

---

## 4. Error Response Contract

All errors follow this contract:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "requestId": "correlation-id-for-debugging",
  "timestamp": 1716806400000
}
```

**Standard Error Codes:**
- `AUTH_MISSING` — Missing Authorization header
- `AUTH_INVALID` — Invalid or expired token
- `VALIDATION_ERROR` — Request body validation failed
- `AI_CONFIG_ERROR` — DeepSeek API key not configured (503)
- `AI_SERVICE_ERROR` — DeepSeek API call failed (503)
- `INTERNAL_ERROR` — Unexpected server error (500)

---

## 5. Logging

Each request is logged with:
- `requestId` — UUID for tracing
- `uidHash` — SHA256(uid, first 8 chars) — no raw user identifiers
- `duration` — Response time in ms
- `event` — Semantic event name (e.g., `daily_guidance_generated`)

**Example log:**
```json
{
  "level": "INFO",
  "timestamp": "2026-05-27T16:02:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "event": "daily_guidance_generated",
  "uidHash": "a1b2c3d4",
  "date": "2026-05-27",
  "duration": 1234
}
```

---

## 6. Firestore Collections (v3_* only)

**No V2 collections are accessed or written to.**

Collections created by endpoints:
- `v3_daily_guidance/{uid}/days/{date}` — Daily guidance records
- `v3_blueprints/{uid}` — User blueprints
- `v3_chat_sessions/{uid}/sessions/{sessionId}/messages/{messageId}` — Chat messages
- `v3_users/{uid}` — User profiles (created on first request)

---

## 7. Deployment

**Prerequisites:**
1. Firebase CLI authenticated (`firebase login` or `--token` flag)
2. `DEEPSEEK_API_KEY` environment variable set in Firebase functions

**Deploy Command:**
```bash
firebase deploy --only functions --project thrive-8e99c --token "<token>"
```

**Verify Deployment:**
```bash
firebase functions:list --project thrive-8e99c
```

**Expected Output:**
```
✔ api (HTTP) ... https://us-central1-thrive-8e99c.cloudfunctions.net/api
```

---

## 8. Performance Targets

- **Non-AI endpoints** (`/v3/health`, `/v3/auth/profile`): P95 < 100ms
- **AI endpoints** (`/v3/generateDailyGuidance`, `/v3/generateBlueprint`, `/v3/sendChatMessage`): P95 < 2.5s

---

## 9. Testing Checklist

- [ ] `/v3/health` returns 200
- [ ] `/v3/auth/profile` returns 401 without token
- [ ] `/v3/auth/profile` returns 401 with invalid token
- [ ] `/v3/auth/profile` returns 200 with valid token
- [ ] `/v3/generateDailyGuidance` stores data in Firestore
- [ ] `/v3/generateBlueprint` stores data in Firestore
- [ ] `/v3/sendChatMessage` creates session if needed
- [ ] `/v3/sendChatMessage` stores both user and assistant messages
- [ ] All error responses have proper HTTP status codes
- [ ] All error responses include `requestId`
- [ ] No V2 collections are accessed in logs
- [ ] Structured logs are emitted for each endpoint
