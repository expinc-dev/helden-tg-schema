import { z } from 'zod'

// Durable per-player result, written from RTDB → Firestore on phase completion.
// Firestore path: /sessions/{sessionId}/results/{playerId}. See BLUEPRINT_schema §6.
export const phaseResultSchema = z.object({
  score: z.number().optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  completedAt: z
    .union([z.string(), z.number(), z.object({ seconds: z.number(), nanoseconds: z.number() }).passthrough()])
    .optional(),
})
export type PhaseResult = z.infer<typeof phaseResultSchema>

export const playerResultSchema = z.object({
  playerId: z.string(),
  sessionId: z.string(),
  phaseResults: z.record(z.string(), phaseResultSchema),
})
export type PlayerResult = z.infer<typeof playerResultSchema>

// Team Mode counterpart, written instead of PlayerResult for phases whose teamMode
// is "team_leader_only"/"team_collaborative" — same shape, keyed by teamId not playerId.
// Firestore path: /sessions/{sessionId}/teamResults/{teamId}.
export const teamResultSchema = z.object({
  teamId: z.string(),
  sessionId: z.string(),
  phaseResults: z.record(z.string(), phaseResultSchema),
})
export type TeamResult = z.infer<typeof teamResultSchema>
