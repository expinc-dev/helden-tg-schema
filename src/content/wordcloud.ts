import { z } from 'zod'

const nonBlankString = z.string().refine((s) => s.trim().length > 0, { message: 'must not be blank' })

// Word cloud — every player submits a word to one shared prompt and the central
// screen renders them as a cloud (size by frequency is a runtime concern). The
// host can hide individual words; that live state lives in rtdb.ts
// (`wordCloudLiveSchema`), not here.
//
// Deliberately NOT part of this shape:
//  - no "number of words" setting (how many a player may submit is a runtime call),
//  - no score by default — pair with an absent `scoring` or `scoring.mode: 'none'`
//    (enforced in `phaseSchema`, see phase.ts). The one exception (5.6.0) is
//    `pointsByWordCount` below, which allows scoring.mode "participation",
//  - no timer — use the generic `phase.timer`, same as every other phase.
//
// `prompt` is the first multi-language text in the schema. en + nl are both
// required so the runtime never has to handle a missing language. A new language
// is added later as an OPTIONAL key (MINOR bump), never as a new required one.
export const wordCloudPromptSchema = z.object({
  en: nonBlankString,
  nl: nonBlankString,
})
export type WordCloudPrompt = z.infer<typeof wordCloudPromptSchema>

// 5.6.0 (COA Kennisquiz): points by how many words a team submitted. A tier is the
// minimum word count and the points it earns; the highest tier whose `minWords` is
// <= the count wins (not cumulative), below the first tier = 0 points. Example from
// the document: 1-3 words = 1 point, 4-6 = 2, 7 or more = 3 ->
// [{ minWords: 1, points: 1 }, { minWords: 4, points: 2 }, { minWords: 7, points: 3 }].
// There is no right or wrong: only the number of words counts, not the text.
export const wordCountTierSchema = z.object({
  minWords: z.number().int().positive(),
  points: z.number().nonnegative(),
})
export type WordCountTier = z.infer<typeof wordCountTierSchema>

export const wordCloudContentSchema = z.object({
  type: z.literal('wordCloud'),
  prompt: wordCloudPromptSchema,
  // Longest word a player may submit, in characters.
  maxWordLen: z.number().int().positive(),
  // 5.6.0: the cloud is shown blurred until the host removes the blur (live state:
  // `blurRemoved` in wordCloudLiveSchema). Absent/false = never blurred, as before.
  blurred: z.boolean().optional(),
  // 5.6.0: points by word count. When set, the phase MUST have scoring.mode
  // "participation" (see phaseSchema); the tiers decide the points, not maxPoints.
  // Absent = a word cloud with no score, as before.
  pointsByWordCount: z
    .array(wordCountTierSchema)
    .min(1)
    .refine((tiers) => tiers.every((t, i) => i === 0 || t.minWords > tiers[i - 1]!.minWords), {
      message: 'tiers must be listed with strictly increasing minWords',
    })
    .optional(),
})
export type WordCloudContent = z.infer<typeof wordCloudContentSchema>
