import { z } from 'zod'
import { blockSchema } from './blocks.js'
import { codeInputContentSchema } from './content/codeinput.js'
import { codePieceContentSchema } from './content/codepiece.js'
import { contentPageContentSchema } from './content/content-page.js'
import { endContentSchema } from './content/end.js'
import { idleContentSchema } from './content/idle.js'
import { microlearningContentSchema } from './content/microlearning.js'
import { miniGameContentSchema } from './content/minigame.js'
import { normalQuizContentSchema } from './content/normalquiz.js'
import { presentationContentSchema } from './content/presentation.js'
import { quizContentSchema } from './content/quiz.js'
import { reflectionContentSchema } from './content/reflection.js'
import { summaryContentSchema } from './content/summary.js'
import { unlockingContentSchema } from './content/unlocking.js'
import { videoContentSchema } from './content/video.js'
import { wordCloudContentSchema } from './content/wordcloud.js'
import { worldBuildingContentSchema } from './content/worldbuilding.js'
import { optionIdsSchema } from './teamchoice.js'

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
  'end',
  'unlocking',
  'worldbuilding',
  'normalquiz',
  'summary',
  'wordCloud',
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
  endContentSchema,
  unlockingContentSchema,
  worldBuildingContentSchema,
  normalQuizContentSchema,
  summaryContentSchema,
  wordCloudContentSchema,
])
export type PhaseContent = z.infer<typeof phaseContentSchema>

// Host-facing script for a phase. Authoring + render is host-only: the runtime
// shows it on `/host`, and it MUST be stripped from the player-safe bundle
// (tg-cms projection + demoBundlePlayerSafe) so it never reaches a player
// device. `anchorScript` is the material the host reads aloud; `sharingPrompts`
// are the discussion prompts the host poses to the room. Both reuse `Block[]`
// so the host panel renders through the same renderer as every other surface.
// `improvMarker` toggles the non-dismissible "HOST IMPROVISATION" banner.
// Every field is optional: an absent (or empty) group renders the runtime's
// "no script authored for this phase" fallback.
export const hostScriptSchema = z.object({
  anchorScript: z.array(blockSchema).optional(),
  sharingPrompts: z.array(blockSchema).optional(),
  improvMarker: z.boolean().optional(),
  // 5.6.0: the quizmaster's notes for the block (the Kennisquiz "Na blok ..." text),
  // shown on the host screen. Host-only like the rest of hostScript: stripped from
  // the player-safe bundle.
  blockNotes: z.array(blockSchema).optional(),
})
export type HostScript = z.infer<typeof hostScriptSchema>

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
  // Host-facing script (see hostScriptSchema). Host-only — stripped from the
  // player-safe bundle at publish time.
  hostScript: hostScriptSchema.optional(),
  // 5.7.0: groups phases into one scored block (a Kennisquiz block is several
  // phases: quiz phases and word clouds). Phases that share a `blockId` form one
  // block; the block score of a team (or player) is the sum of its scores over those
  // phases, kept in `liveAggregates.blockScores[blockId]`. The runtime shows it after
  // the block's last phase in `phaseOrder` when any phase of the block has
  // `showBlockScore` (quiz content). Absent = the phase is its own block, keyed by
  // its phase id, exactly as before. Any non-blank string works; the CMS generates it.
  blockId: z
    .string()
    .refine((s) => s.trim().length > 0, { message: 'must not be blank' })
    .optional(),
  // 5.11.0: Team Choice option ids this phase is limited to ("only for these options").
  // Absent = the phase is for every option. Teams without an option only get phases
  // WITHOUT this field. Same semantics as Block.onlyForOptions (see blocks.ts); every id
  // must be one of PublishedGame.teamChoice.options (checked in publishedGameSchema).
  // The phase pointer is shared by the whole session, so what the other teams see while
  // one option's phase runs is a runtime decision.
  onlyForOptions: optionIdsSchema.optional(),
}).superRefine((phase, ctx) => {
  // Rules that only apply to a word cloud phase. Scoped on purpose: `type` vs
  // `content.type` is NOT cross-checked for the other phase types, so bundles
  // that already exist keep parsing exactly as before.
  if (phase.type !== 'wordCloud' && phase.content.type !== 'wordCloud') return

  if (phase.type !== phase.content.type) {
    ctx.addIssue({
      code: 'custom',
      path: ['content', 'type'],
      message: `content.type "${phase.content.type}" must match phase type "${phase.type}"`,
    })
  }
  // A word cloud has no score: `scoring` is absent, or explicitly mode "none".
  // Exception (5.6.0): a word cloud with `content.pointsByWordCount` scores by word
  // count, and then `scoring.mode` must be "participation" (the tiers decide the
  // points). Without tiers, "participation" is rejected exactly as before.
  const tiered = phase.content.type === 'wordCloud' && phase.content.pointsByWordCount !== undefined
  if (tiered) {
    if (phase.scoring?.mode !== 'participation') {
      ctx.addIssue({
        code: 'custom',
        path: ['scoring', 'mode'],
        message: 'a wordCloud with pointsByWordCount needs scoring.mode "participation"',
      })
    }
  } else if (phase.scoring !== undefined && phase.scoring.mode !== 'none') {
    ctx.addIssue({
      code: 'custom',
      path: ['scoring', 'mode'],
      message: 'a wordCloud phase has no score: omit scoring or use mode "none"',
    })
  }
})
export type Phase = z.infer<typeof phaseSchema>
