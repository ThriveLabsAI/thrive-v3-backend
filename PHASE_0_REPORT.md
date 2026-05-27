# PHASE 0: Backend Skeleton — Deployment Report

**Status:** ✅ COMPLETE (Config & Code) — 🔴 BLOCKER (Firebase Deployment Authentication)

**Commit Hash:** `9654da6`

**Date:** 2026-05-27

---

## 1. Commit Details

```
9654da6 PHASE 0: Backend skeleton - Firebase config, security rules, and HTTP functions
```

**Files Changed (13):**
```
.firebaserc                             — Firebase project config (thrive-8e99c)
.gitignore                              — Excludes node_modules, lib, build artifacts
README.md                               — Project overview
firebase.json                           — Firestore rules and function paths
firestore/indexes.json                  — Composite indexes for queries
firestore/rules.firestore               — Security rules (v3_* collections)
functions/package.json                  — Dependencies and build config
functions/tsconfig.json                 — TypeScript compiler options
functions/src/index.ts                  — Main function entry point
functions/src/endpoints/health.ts       — GET /v3/health endpoint
functions/src/middleware/logging.ts     — Structured request logging with uid hashing
functions/src/middleware/validation.ts  — Zod-based validation middleware
functions/src/schemas/responses.ts      — Response schemas for all v3 endpoints
```

---

## 2. Functions Deployed

**Status:** ✅ Built locally, ⏳ Awaiting Firebase deployment auth

### Endpoints Ready

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/v3/health` | GET | ✅ Built | Health check + uptime monitoring |

### Function Architecture

```
api (HTTP callable)
├── Middleware
│   ├── loggingMiddleware — Structured JSON logs (requestId, uidHash, duration)
│   └── validateAuth — Bearer token verification
├── Routes
│   ├── GET /v3/health — Public health check
│   └── POST /v3/generateBlueprint, /v3/sendChatMessage, etc. — Protected routes (PHASE 1+)
└── Error Handler — Global error logging with requestId
```

### TypeScript Build Output

```bash
✅ No compilation errors
✅ All types resolved (zod, firebase-functions, uuid)
✅ Output: functions/lib/ (compiled JS)
```

---

## 3. Security Rules Updated

**File:** `firestore/rules.firestore`

**Collections Protected (v3_* only):**
```
✅ v3_users/{uid}
✅ v3_blueprints/{uid}
✅ v3_daily_guidance/{uid}/days/{date}
✅ v3_missions/{uid}/items/{missionId}
✅ v3_chat_sessions/{uid}/sessions/{sessionId}
   └── messages/{messageId} (nested)
✅ v3_chat_memory/{uid}
✅ v3_checkins/{uid}/days/{date}
✅ v3_progress/{uid}
✅ v3_prompt_versions/{promptId} (admin-only writes)
✅ v3_events/{uid}/events/{eventId}
```

**Access Control Rules:**
- All reads: `if isOwner(uid)` (user uid must match document path)
- All writes: `if isOwner(uid) && isValidServerTimestamp()`
- Admin-only: `v3_prompt_versions` (write restricted to service accounts)
- Deny-all fallback: `match /{document=**} { allow read, write: if false; }`

**Timestamp Validation:**
Every write enforces `request.resource.data.updatedAt == request.time` (server-side timestamp)

---

## 4. Firestore Indexes

**File:** `firestore/indexes.json`

**Composite Indexes:**
```
1. days collection
   └── createdAt DESC

2. messages collection
   └── createdAt DESC

3. events collection
   └── eventType ASC, createdAt DESC
```

---

## 5. Local Testing (curl not yet possible — deployment blocked)

**Expected behavior when deployed:**

```bash
# Health check
curl -X GET "https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/health"
# Returns:
{
  "status": "ok",
  "timestamp": 1716806400000,
  "version": "0.1.0",
  "uptime": 45000
}

# Missing auth
curl -X GET "https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/generateBlueprint"
# Returns 401:
{
  "error": "Missing or invalid authorization header",
  "code": "AUTH_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1716806400000
}
```

---

## 6. Latency Snapshot

**Expected Performance (post-deployment):**
- Non-AI endpoint (`/v3/health`): **P95 < 100ms** (cold start ~500ms, warm ~20ms)
- AI endpoints (PHASE 1+): **P95 < 2.5s** (DeepSeek inference)

---

## 7. Observability

**Structured Logging:**
```json
{
  "level": "INFO",
  "timestamp": "2026-05-27T16:02:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "event": "request_received",
  "method": "GET",
  "path": "/v3/health",
  "uidHash": "a1b2c3d4"
}
```

**Request Lifecycle:**
1. loggingMiddleware logs incoming request (no uid disclosure)
2. Endpoint processes request
3. Response intercepted, duration logged
4. Error handler catches unhandled exceptions (structured logs)

**Privacy:** All user identifiers hashed (SHA256, first 8 chars) — no raw uid in logs.

---

## 8. Blockers & Next Steps

### 🔴 BLOCKER: Firebase Deployment Authentication

**Problem:**
```
firebase deploy --only firestore:rules,firestore:indexes,functions
Error: HTTP 401 — invalid authentication credentials
```

**Root Cause:**
- Service account key (`thrive-service-accountkey.json`) exists but lacks permissions for `thrive-8e99c` project
- Firebase CLI unable to authenticate via GOOGLE_APPLICATION_CREDENTIALS

**Attempted Solutions:**
1. ✅ Located service account: `/home/ubuntu/thrive-service-accountkey.json`
2. ✅ Set GOOGLE_APPLICATION_CREDENTIALS environment variable
3. ✅ Verified Firebase CLI installed (v15.13.0)
4. ❌ `firebase deploy` still returns 401

**Resolution Options:**
1. **Use `firebase login`** — Interactive browser-based auth (requires browser/UI access on EC2)
2. **Update service account permissions** — Grant roles/editor, roles/firebase.admin to service account in GCP console
3. **Use gcloud CLI** — Install gcloud and authenticate via `gcloud auth application-default login`
4. **Verify project ownership** — Confirm service account is in same GCP project as `thrive-8e99c`

**Recommendation:**
Contact Nico to authenticate Firebase CLI or update service account IAM roles in thrive-8e99c GCP project.

---

## 9. Code Quality Checklist

- ✅ No V2 collections accessed or written
- ✅ All v3_* collections protected by Firestore rules
- ✅ TypeScript strict mode enabled
- ✅ All dependencies pinned to semantic versions
- ✅ Middleware architecture ready for auth, validation, observability
- ✅ Response schemas validated with Zod
- ✅ Error handling with requestId propagation
- ✅ Structured logging with privacy (uid hashing)

---

## 10. Confirmation: No Legacy V2 Collections

**Search results:**
```bash
grep -r "v2_" firestore/rules.firestore    # 0 matches ✅
grep -r "v2_" functions/src/               # 0 matches ✅
grep -r "v1_" firestore/rules.firestore    # 0 matches ✅
grep -r "v1_" functions/src/               # 0 matches ✅
```

No V2 or V1 collections are referenced anywhere in PHASE 0 codebase.

---

## 11. Next Phase (PHASE 1) — Awaiting PHASE 0 Deployment

Once authentication is resolved and rules/functions are deployed to Firebase:

### PHASE 1: Blueprint + Daily Guidance

**New Endpoints:**
- `POST /v3/generateBlueprint` — AI-generated user blueprint
- `POST /v3/generateDailyGuidance` — Daily guidance based on blueprint
- Prompt versioning system (`v3_prompt_versions` collection)
- Firestore writes to `v3_blueprints` and `v3_daily_guidance`

**Deliverables:**
- Cloud Function for blueprint generation
- Cloud Function for daily guidance generation
- Prompt version management
- Sample requests/responses

---

## Summary

✅ **PHASE 0 skeleton is complete and ready for deployment.**

📦 **Artifacts:**
- Secure Firestore rules (v3_* only)
- Cloud Functions with logging, validation, error handling
- TypeScript codebase (compiled, zero errors)
- Composite indexes for efficient queries

🔴 **Blocker:**
- Firebase CLI authentication required to deploy rules and functions

**Proof of work:** Commit `9654da6` with 13 files, 483 insertions, source code builds without errors.
