import { z } from 'zod'
import { codeInputContentSchema } from './content/codeinput.js'
import { codePieceContentSchema } from './content/codepiece.js'
import { contentPageContentSchema } from './content/content-page.js'
import { idleContentSchema } from './content/idle.js'
import { microlearningContentSchema } from './content/microlearning.js'
import { miniGameContentSchema } from './content/minigame.js'
import { presentationContentSchema } from './content/presentation.js'
import { quizContentSchema } from './content/quiz.js'
import { reflectionContentSchema } from './content/reflection.js'
import { videoContentSchema } from './content/video.js'

export const phaseTypeSchema = z.enum([
  'microlearning',
  'quiz',
  'video',
  'content',
  'codepiece',
  'codeinput',
  'presentation',
  'idle',
  'minigame',
  'reflection',
])
export type PhaseType = z.infer<typeof phaseTypeSchema>

// lockstep = host/timer drives everyone to the same step (quiz, video-together, presentation).
// self_paced = each player advances independently (microlearning, self-read content).
export const syncModeSchema = z.enum(['lockstep', 'self_paced'])
export type SyncMode = z.infer<typeof syncModeSchema>

// Team Mode: how this phase attributes progress/scoring when session.allowTeams is on.
// individual = teams ignored, behaves exactly as today (default when field absent).
// team_leader_only = one member (the team owner) acts, result attributed to the team.
// team_collaborative = all members act, result is still attributed to the team (not each member).
// Absent = "individual". Orthogonal to syncMode: a phase's syncMode still governs step
// advancement; teamMode only governs whether results/scores key by playerId or teamId.
export const teamModeSchema = z.enum(['individual', 'team_leader_only', 'team_collaborative'])
export type TeamMode = z.infer<typeof teamModeSchema>

export const roleViewSchema = z.object({
  enabled: z.boolean(),
  showTimer: z.boolean().optional(),
  showResults: z.boolean().optional(),
})
export type RoleView = z.infer<typeof roleViewSchema>

export const hostViewSchema = z.object({
  monitor: z.array(z.enum(['scores', 'answers', 'presence', 'progress'])),
})
export type HostView = z.infer<typeof hostViewSchema>

export const timerConfigSchema = z.object({
  seconds: z.number().int().nonnegative(),
  authority: z.enum(['central', 'host', 'server']),
  autoAdvanceOnExpire: z.boolean().optional(),
  visibleTo: z.array(z.enum(['player', 'central'])),
})
export type TimerConfig = z.infer<typeof timerConfigSchema>

export const scoringConfigSchema = z.object({
  mode: z.enum(['correctness', 'speed', 'correctness_and_speed', 'participation', 'none']),
  maxPoints: z.number().nonnegative().optional(),
  speedBonus: z
    .object({
      maxBonus: z.number().nonnegative(),
      decaySeconds: z.number().positive(),
    })
    .optional(),
})
export type ScoringConfig = z.infer<typeof scoringConfigSchema>

export const rolesSchema = z.object({
  player: roleViewSchema.optional(),
  central: roleViewSchema.optional(),
  host: hostViewSchema.optional(),
})
export type Roles = z.infer<typeof rolesSchema>

// PhaseContent — polymorphic core, discriminated by `type`.
export const phaseContentSchema = z.discriminatedUnion('type', [
  microlearningContentSchema,
  quizContentSchema,
  videoContentSchema,
  contentPageContentSchema,
  codePieceContentSchema,
  codeInputContentSchema,
  presentationContentSchema,
  idleContentSchema,
  miniGameContentSchema,
  reflectionContentSchema,
])
export type PhaseContent = z.infer<typeof phaseContentSchema>

export const phaseSchema = z.object({
  id: z.string(),
  type: phaseTypeSchema,
  title: z.string(),
  syncMode: syncModeSchema,
  teamMode: teamModeSchema.optional(),
  roles: rolesSchema,
  timer: timerConfigSchema.optional(),
  scoring: scoringConfigSchema.optional(),
  content: phaseContentSchema,
  // Optional per-phase thumbnail (media id). Consumed by host page control in
  // modular flow to render a level-card image; runtime falls back to a
  // placeholder when absent. Author-time field, CMS will surface later.
  thumbnailMediaId: z.string().optional(),
  // Author-declared time estimate for this phase, in minutes. Surfaced on the
  // host picker level card so the trainer can pace the session. Purely
  // informational — runtime does NOT enforce it (use `timer.seconds` +
  // `autoAdvanceOnExpire` for hard timeouts).
  durationMin: z.number().nonnegative().optional(),
})
export type Phase = z.infer<typeof phaseSchema>
