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
  // Team Mode: when true the runtime shows a team create/join gate after join and
  // renders team-aware phases (codeinput) against per-team state. Absent/false =
  // the whole session is a single group (legacy behaviour).
  allowTeams: z.boolean().optional(),
  // Optional cap on team roster size (counts memberIds incl. owner). Absent = no
  // cap. Enforced by transaction on teams/{teamId}.memberIds, like maxPlayers.
  maxMembers: z.number().int().positive().optional(),
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
  // Team Mode: which team this player belongs to. Single source of team
  // membership — a team's roster is derived by filtering players on teamId.
  teamId: z.string().optional(),
})
export type PlayerPresence = z.infer<typeof playerPresenceSchema>

export const phasePointerSchema = z.object({
  activePhaseId: z.string(),
  changedAt: z.number(),
  changedBy: z.string(),
})
export type PhasePointer = z.infer<typeof phasePointerSchema>

// Server-authoritative timer: /sessions/{sessionId}/timer. Written ONCE by the
// host when a timed phase opens — endsAt is an absolute epoch-ms deadline the host
// computes offset-corrected. Every device renders endsAt − (now + serverTimeOffset),
// so no device trusts its local clock and none runs its own authoritative countdown.
// phaseId guards against a stale timer from a previous phase.
export const sessionTimerSchema = z.object({
  phaseId: z.string(),
  endsAt: z.number(), // epoch ms
})
export type SessionTimer = z.infer<typeof sessionTimerSchema>

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

// Team Mode node: /sessions/{sessionId}/teams/{teamId}. FLAT membership relation:
// every device stays an equal players/{playerId}; this node just points at the
// members. memberIds is the authoritative roster (owner included) and the anchor
// for the maxMembers transaction. player.teamId points back here. codeinput is
// keyed by phaseId so one team can solve several codeinput phases.
//
// memberIds is a MAP (playerId -> true), not an array — deliberately, so it can
// be validated the same way playerOwners/answeredBy are in database.rules.json.
// RTDB security rules have no numChildren()/.length/indexing for list-shaped
// values (confirmed against the live Rules Playground while building this), so
// an array here would mean "only the owner may touch this field at all" is the
// best rules can do — a per-key map lets a NEW member self-join by writing only
// their own key, exactly like answeredBy's per-key write-once pattern.
export const teamSchema = z.object({
  ownerPlayerId: z.string(),
  memberIds: z.record(z.string(), z.literal(true)), // includes the owner
  teamName: z.string().optional(),
  createdAt: z.number(),
  codeinput: z.record(z.string(), codeInputLiveSchema).optional(),
})
export type Team = z.infer<typeof teamSchema>

export const liveAggregatesSchema = z.object({
  answeredCount: z.record(z.string(), z.number().int().nonnegative()).optional(),
  // Keyed by playerId — phases with teamMode "individual" (or absent) write here.
  scores: z.record(z.string(), z.number()).optional(),
  // Keyed by teamId — phases with teamMode "team_leader_only"/"team_collaborative"
  // write here instead of `scores`, so a team's score is attributed once, not
  // duplicated per member.
  teamScores: z.record(z.string(), z.number()).optional(),
  // Set-marker keeping `answeredCount` honest across duplicate submits and team
  // modes: {qId → {keyId → true}} where keyId is playerId (individual) or teamId
  // (team modes). The submit transaction bumps answeredCount ONLY when the
  // marker was absent, so 3 devices in the same team = 1 count.
  answeredBy: z.record(z.string(), z.record(z.string(), z.literal(true))).optional(),
})
export type LiveAggregates = z.infer<typeof liveAggregatesSchema>
