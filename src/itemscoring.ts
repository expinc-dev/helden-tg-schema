import { z } from 'zod'

// Per-question scoring for answers that are right or wrong item by item.
//
// The phase-level `ScoringConfig` (phase.ts) is all-or-nothing: one `maxPoints`
// when the whole answer is right. The COA Kennisquiz needs more than that, so a
// question can carry its own `ItemScoring`. It is OPTIONAL everywhere: a question
// without it keeps scoring through `phase.scoring`, exactly as before.
//
// The runtime counts "right items" and "wrong items" for the question type that
// carries this (e.g. for `multi_choice`: a selected option that is in `correctIds`
// is right, a selected option that is not in `correctIds` is wrong; options left
// unselected count for neither; for `order`: an item at its authored position is
// right, an item anywhere else is wrong). This file is shape + validation only; the
// arithmetic lives in the runtime's scoring module.
//
//  - per_item: each right item earns `correctPoints`; each wrong item costs
//    `wrongPenalty` (default 0 = no penalty). Example: +1 right / -1 wrong.
//    The question total is floored at 0 unless `allowNegativeTotal` is true.
//  - tiers: points depend on HOW MANY items are right. The highest tier whose
//    `minCorrect` is <= the right-item count wins (not cumulative). Below the
//    first tier = 0 points. Example: 5 right = 3, 8 right = 5, all (14) = 7.
//    Wrong items do not reduce a tiered score.
export const perItemScoringSchema = z.object({
  rule: z.literal('per_item'),
  correctPoints: z.number().nonnegative(),
  wrongPenalty: z.number().nonnegative().optional(),
  allowNegativeTotal: z.boolean().optional(),
})
export type PerItemScoring = z.infer<typeof perItemScoringSchema>

export const scoreTierSchema = z.object({
  minCorrect: z.number().int().positive(),
  points: z.number().nonnegative(),
})
export type ScoreTier = z.infer<typeof scoreTierSchema>

export const tieredScoringSchema = z.object({
  rule: z.literal('tiers'),
  tiers: z
    .array(scoreTierSchema)
    .min(1)
    .refine((tiers) => tiers.every((t, i) => i === 0 || t.minCorrect > tiers[i - 1]!.minCorrect), {
      message: 'tiers must be listed with strictly increasing minCorrect',
    }),
})
export type TieredScoring = z.infer<typeof tieredScoringSchema>

// - manual (5.8.0): the game does not grade the answer. The quizmaster gives each
//   team 0..maxPoints by hand on the host screen (Kennisquiz: RI&E themes, the
//   meanings of the abbreviations, open questions scored by the jury).
export const manualScoringSchema = z.object({
  rule: z.literal('manual'),
  maxPoints: z.number().positive(),
})
export type ManualScoring = z.infer<typeof manualScoringSchema>

export const itemScoringSchema = z.discriminatedUnion('rule', [
  perItemScoringSchema,
  tieredScoringSchema,
  manualScoringSchema,
])
export type ItemScoring = z.infer<typeof itemScoringSchema>
