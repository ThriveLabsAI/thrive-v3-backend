import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.number(),
  version: z.string(),
  uptime: z.number().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  requestId: z.string(),
  timestamp: z.number(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const BlueprintResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  blueprintId: z.string().optional(),
  content: z.string().optional(),
  error: z.string().optional(),
  requestId: z.string(),
  timestamp: z.number(),
});

export type BlueprintResponse = z.infer<typeof BlueprintResponseSchema>;

export const ChatMessageResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  messageId: z.string().optional(),
  role: z.enum(['user', 'assistant']).optional(),
  content: z.string().optional(),
  error: z.string().optional(),
  requestId: z.string(),
  timestamp: z.number(),
});

export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;
