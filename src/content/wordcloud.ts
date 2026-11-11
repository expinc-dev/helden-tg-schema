import { z } from 'zod'

const nonBlankString = z.string().refine((s) => s.trim().length > 0, { message: 'must not be blank' })

// Word cloud — every player submits a word to one shared prompt and the central
// screen renders them as a cloud (size by frequency is a runtime concern). The
// host can hide individual words; that live state lives in rtdb.ts
// (`wordCloudLiveSchema`), not here.
//
// Deliberately NOT part of this shape:
//  - no "number of words" setting (how many a player may submit is a runtime call),
//  - no score — pair with an absent `scoring` or `scoring.mode: 'none'`
//    (enforced in `phaseSchema`, see phase.ts),
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

export const wordCloudContentSchema = z.object({
  type: z.literal('wordCloud'),
  prompt: wordCloudPromptSchema,
  // Longest word a player may submit, in characters.
  maxWordLen: z.number().int().positive(),
})
export type WordCloudContent = z.infer<typeof wordCloudContentSchema>
