import { z } from 'zod';

// ===== HEALTH =====
export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.number(),
  version: z.string(),
  uptime: z.number().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ===== ERROR =====
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  requestId: z.string(),
  timestamp: z.number(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ===== BLUEPRINT =====
export const BlueprintRequestSchema = z.object({
  name: z.string().min(1),
  focusAreas: z.array(z.string()).optional(),
  emotionalGoal: z.string().optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthdate must be YYYY-MM-DD'),
  tonePreference: z.enum(['gentle', 'direct', 'spiritual-light', 'practical', 'deep-reflection']).optional(),
});

export type BlueprintRequest = z.infer<typeof BlueprintRequestSchema>;

export const BlueprintSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const BlueprintResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(BlueprintSectionSchema),
  generatedAt: z.string().datetime(),
});

export type BlueprintResponse = z.infer<typeof BlueprintResponseSchema>;

// ===== DAILY GUIDANCE =====
export const DailyGuidanceRequestSchema = z.object({
  date: z.string().optional(),
});

export type DailyGuidanceRequest = z.infer<typeof DailyGuidanceRequestSchema>;

export const MissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedMinutes: z.number(),
});

export type Mission = z.infer<typeof MissionSchema>;

export const DailyGuidanceResponseSchema = z.object({
  message: z.string(),
  affirmation: z.string().optional(),
  action: z.string().optional(),
  generatedAt: z.string().datetime(),
  mission: MissionSchema.optional(),
  patternToWatch: z.string().optional(),
  strengthToUse: z.string().optional(),
});

export type DailyGuidanceResponse = z.infer<typeof DailyGuidanceResponseSchema>;

// ===== CHAT MESSAGE =====
export const ChatMessageRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

export type ChatMessageRequest = z.infer<typeof ChatMessageRequestSchema>;

export const ChatMessageResponseSchema = z.object({
  id: z.string(),
  reply: z.string(),
  createdAt: z.string().datetime(),
});

export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;

// ===== CHAT MEMORY =====
export const ChatMemoryRequestSchema = z.object({
  sessionId: z.string(),
  lastThemes: z.array(z.string()).optional(),
  unresolvedTopic: z.string().optional(),
  recentEmotionalState: z.string().optional(),
});

export type ChatMemoryRequest = z.infer<typeof ChatMemoryRequestSchema>;

export const ChatMemoryResponseSchema = z.object({
  uid: z.string(),
  lastThemes: z.array(z.string()),
  unresolvedTopic: z.string().optional(),
  recentEmotionalState: z.string().optional(),
  preferredTone: z.string().optional(),
  lastUpdatedAt: z.string().datetime(),
});

export type ChatMemoryResponse = z.infer<typeof ChatMemoryResponseSchema>;

// ===== AUTH PROFILE =====
export const AuthProfileResponseSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  lastSignIn: z.string().datetime().optional(),
});

export type AuthProfileResponse = z.infer<typeof AuthProfileResponseSchema>;
