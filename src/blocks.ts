import { z } from 'zod'

// Block ↔ Question is mutually recursive (a question's prompt is Block[],
// and a Block can be a question). We declare the TS types first, then annotate
// the schemas with z.ZodType<T> so tsc doesn't choke on the self-reference.

export type Choice = { id: string; label: string; mediaId?: string }

export type Question =
  | { qType: 'single_choice'; prompt: Block[]; options: Choice[]; correctId?: string }
  | { qType: 'multi_choice'; prompt: Block[]; options: Choice[]; correctIds?: string[] }
  | { qType: 'open_text'; prompt: Block[]; maxLen?: number; rubricHint?: string }
  | {
      qType: 'scale'
      prompt: Block[]
      min: number
      max: number
      labels?: [string, string]
    }
  | {
      qType: 'short_answer'
      prompt: Block[]
      acceptedAnswers?: string[]
      caseSensitive?: boolean
    }

export type Block =
  | { kind: 'text'; markdown: string }
  | { kind: 'image'; mediaId: string; caption?: string }
  | { kind: 'video'; mediaId: string; autoplay?: boolean }
  | { kind: 'question'; question: Question }

export const choiceSchema: z.ZodType<Choice> = z.object({
  id: z.string(),
  label: z.string(),
  mediaId: z.string().optional(),
})

export const questionSchema: z.ZodType<Question> = z.lazy(() =>
  z.discriminatedUnion('qType', [
    z.object({
      qType: z.literal('single_choice'),
      prompt: z.array(blockSchema),
      options: z.array(choiceSchema),
      correctId: z.string().optional(),
    }),
    z.object({
      qType: z.literal('multi_choice'),
      prompt: z.array(blockSchema),
      options: z.array(choiceSchema),
      correctIds: z.array(z.string()).optional(),
    }),
    z.object({
      qType: z.literal('open_text'),
      prompt: z.array(blockSchema),
      maxLen: z.number().int().positive().optional(),
      rubricHint: z.string().optional(),
    }),
    z.object({
      qType: z.literal('scale'),
      prompt: z.array(blockSchema),
      min: z.number().int(),
      max: z.number().int(),
      labels: z.tuple([z.string(), z.string()]).optional(),
    }),
    z.object({
      qType: z.literal('short_answer'),
      prompt: z.array(blockSchema),
      acceptedAnswers: z.array(z.string()).optional(),
      caseSensitive: z.boolean().optional(),
    }),
  ]),
)

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), markdown: z.string() }),
    z.object({
      kind: z.literal('image'),
      mediaId: z.string(),
      caption: z.string().optional(),
    }),
    z.object({
      kind: z.literal('video'),
      mediaId: z.string(),
      autoplay: z.boolean().optional(),
    }),
    z.object({ kind: z.literal('question'), question: questionSchema }),
  ]),
)
