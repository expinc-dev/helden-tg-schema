import { z } from 'zod'
import { optionIdSchema } from '../teamchoice.js'

export const codeInputContentSchema = z.object({
  type: z.literal('codeinput'),
  // The code to enter. With Team Choice (5.11.0) it is the FALLBACK: the code of a team
  // that has no option, or whose option has no entry in `expectedByOption`. It stays
  // required so every code input keeps one valid code; the CMS still writes '' here in the
  // player-safe file, like it does without Team Choice.
  expected: z.string(),
  // 5.11.0: a different expected code per Team Choice option: { [optionId]: code }. A team
  // that picked option X checks its guess against `expectedByOption[X]`, and falls back to
  // `expected` when X has no entry. Every key must be an option id of the game (checked in
  // publishedGameSchema, which can see PublishedGame.teamChoice; this shape cannot).
  // ANSWER KEY: every value is a code the players must not read, so the CMS must strip it
  // from the player-safe bundle, like `expected` and the `matches` / `correctId` keys. A
  // stripped value is '' or the whole field removed.
  expectedByOption: z.record(optionIdSchema, z.string()).optional(),
  caseSensitive: z.boolean().optional(),
  maxAttempts: z.number().int().positive().optional(),
  onSuccess: z.object({
    advance: z.boolean(),
  }),
  // Which CodePiece phase feeds this — used for cross-phase publish validation
  // (BLUEPRINT_cms §7: fragments must assemble into `expected`).
  sourcePhaseId: z.string().optional(),
})
export type CodeInputContent = z.infer<typeof codeInputContentSchema>
