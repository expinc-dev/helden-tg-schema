import { z } from 'zod'
import { phaseSchema } from './phase.js'
import { collectOptionRefs, teamChoiceSchema } from './teamchoice.js'

// Game-level flow. Per-phase syncMode + teamMode already exist; flowMode says
// how the host progresses BETWEEN phases:
//   sequential           = linear next through phaseOrder (host clicks Next).
//   modular-open         = level picker; host jumps to ANY non-played phase.
//                          Played cards are marked "Sudah Dimainkan".
//   modular-progressive  = level picker with progressive unlock. Only the
//                          next-unplayed phase in phaseOrder is tappable; all
//                          later phases show "Locked" until their predecessor
//                          is played. Same picker anchor + End-level model as
//                          modular-open; differs only in which cards are
//                          tappable at a given moment.
// Both modular modes require phaseOrder[0] to be an idle phase (picker anchor).
// Default 'sequential' keeps bundles with no flowMode set working unchanged.
//
// v3 BREAKING RENAME: the pre-3.0 value 'modular' is gone. Bundles that used
// it must migrate to 'modular-open' (identical semantics).
export const flowModeSchema = z.enum(['sequential', 'modular-open', 'modular-progressive'])
export type FlowMode = z.infer<typeof flowModeSchema>

// Firestore Timestamp is not portable into this pure library. Use a Zod branding
// approach: any object with .toDate() OR an ISO string OR a number. Consumers
// (tg-cms/tg-runtime) can refine on their side.
const timestampSchema = z.union([
  z.string(), // ISO
  z.number(), // ms since epoch
  z.object({ seconds: z.number(), nanoseconds: z.number() }).passthrough(), // Firestore Timestamp shape
])
export type SchemaTimestamp = z.infer<typeof timestampSchema>

// GameDraft — mutable authoring doc (Firestore /games/{gameId}).
export const gameDraftSchema = z.object({
  id: z.string(),
  orgId: z.string(), // the owning Client's id — Client is the tenant/org boundary
  title: z.string(),
  schemaVersion: z.string(),
  phaseOrder: z.array(z.string()),
  flowMode: flowModeSchema.default('sequential'),
  defaults: z.object({
    maxPlayers: z.number().int().positive(),
    maxCentralScreens: z.number().int().positive(),
  }),
  updatedAt: timestampSchema,
  latestPublishedVersionId: z.string().optional(),
  // 5.11.0: Team Choice options of the game (see teamchoice.ts). Absent = no options.
  teamChoice: teamChoiceSchema.optional(),
})
export type GameDraft = z.infer<typeof gameDraftSchema>

// PublishedGame — immutable compiled bundle (Firestore /publishedGames/{gameVersionId}).
// Fully resolved, no lazy refs. Runtime loads exactly this.
export const publishedGameSchema = z.object({
  id: z.string(), // gameVersionId
  gameId: z.string(),
  schemaVersion: z.string(),
  title: z.string(),
  phaseOrder: z.array(z.string()),
  flowMode: flowModeSchema.default('sequential'),
  phases: z.record(z.string(), phaseSchema),
  // 5.11.0: Team Choice options of the game (see teamchoice.ts). Absent = no options and
  // the game plays exactly as before.
  teamChoice: teamChoiceSchema.optional(),
  publishedAt: timestampSchema,
  publishedBy: z.string(),
}).superRefine((game, ctx) => {
  // 5.11.0: every option id used in a phase or block (`onlyForOptions`) or as a key of a
  // code input's `expectedByOption` must be an option of this game. A typo would otherwise
  // hide content from every team without any error. A game that uses none of these fields
  // is not checked, so bundles from before 5.11.0 parse exactly as before.
  const refs = collectOptionRefs(game.phases)
  if (refs.length === 0) return
  const known = new Set((game.teamChoice?.options ?? []).map((option) => option.id))
  for (const ref of refs) {
    if (known.has(ref.optionId)) continue
    ctx.addIssue({
      code: 'custom',
      path: ['phases', ...ref.path],
      message: game.teamChoice
        ? `unknown option id "${ref.optionId}": it is not one of teamChoice.options`
        : `option id "${ref.optionId}" is used but the game has no teamChoice`,
    })
  }
})
export type PublishedGame = z.infer<typeof publishedGameSchema>
