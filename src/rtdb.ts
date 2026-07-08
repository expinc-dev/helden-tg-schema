import { z } from 'zod'

// Shape of /sessions/{sessionId}/* in RTDB. See BLUEPRINT_schema §5.

export const sessionStatusSchema = z.enum(['lobby', 'live', 'paused', 'ended'])
export type SessionStatus = z.infer<typeof sessionStatusSchema>

export const sessionMetaSchema = z.object({
  gameVersionId: z.string(),
  hostUid: z.string(),
  status: sessionStatusSchema,
  createdAt: z.number(), // epoch ms
})
export type SessionMeta = z.infer<typeof sessionMetaSchema>

export const sessionConfigSchema = z.object({
  maxPlayers: z.number().int().positive(),
  maxCentralScreens: z.number().int().positive(),
  joinCode: z.string().length(6),
})
export type SessionConfig = z.infer<typeof sessionConfigSchema>

export const centralPresenceSchema = z.object({
  connected: z.boolean(),
  lastSeen: z.number(),
})
export type CentralPresence = z.infer<typeof centralPresenceSchema>

export const playerPresenceSchema = z.object({
  name: z.string(),
  connected: z.boolean(),
  lastSeen: z.number(),
  joinedAt: z.number(),
})
export type PlayerPresence = z.infer<typeof playerPresenceSchema>

export const phasePointerSchema = z.object({
  activePhaseId: z.string(),
  changedAt: z.number(),
  changedBy: z.string(),
})
export type PhasePointer = z.infer<typeof phasePointerSchema>

export const centralStepSchema = z.object({ step: z.number().int().nonnegative() })
export const playerSharedStepSchema = z.object({ step: z.number().int().nonnegative() })

export const playerLiveStatusSchema = z.enum(['active', 'done', 'idle'])
export type PlayerLiveStatus = z.infer<typeof playerLiveStatusSchema>

export const playerAnswerSchema = z.object({
  value: z.unknown(), // shape depends on Question qType
  submittedAt: z.number(),
})
export type PlayerAnswer = z.infer<typeof playerAnswerSchema>

export const playerLiveSchema = z.object({
  selfStep: z.number().int().nonnegative().optional(),
  status: playerLiveStatusSchema,
  answers: z.record(z.string(), playerAnswerSchema).optional(),
})
export type PlayerLive = z.infer<typeof playerLiveSchema>

export const codeInputLiveSchema = z.object({
  attempts: z.number().int().nonnegative(),
  solved: z.boolean(),
  solvedAt: z.number().optional(),
})
export type CodeInputLive = z.infer<typeof codeInputLiveSchema>

export const liveAggregatesSchema = z.object({
  answeredCount: z.record(z.string(), z.number().int().nonnegative()).optional(),
  scores: z.record(z.string(), z.number()).optional(),
})
export type LiveAggregates = z.infer<typeof liveAggregatesSchema>
