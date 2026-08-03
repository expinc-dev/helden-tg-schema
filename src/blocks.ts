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
  // Formalized out of tg-pilot's microlearning-only cast-at-the-boundary hack
  // (OrderQuestion.tsx / ImageSequenceQuestion.tsx — `as unknown as Question`).
  // Drag-to-reorder a fixed list.
  | { qType: 'order'; prompt: Block[]; items: { id: string; label: string }[] }
  // Drag pool images into numbered slots (slots start empty, unlike 'order'
  // which reorders a pre-placed list).
  | { qType: 'image_sequence'; prompt: Block[]; images: { id: string; mediaId: string }[] }

export type Block =
  | { kind: 'text'; markdown: string }
  | {
      kind: 'image'
      mediaId: string
      // Resolved public URL, copied from the picked MediaDoc at pick-time.
      // Runtime renders this directly; mediaId is kept for CMS bookkeeping only.
      url?: string
      caption?: string
    }
  | {
      kind: 'video'
      mediaId: string
      // Same resolved-at-pick-time pattern as image.url. Accepts a CDN file
      // URL from an uploaded MediaDoc, or a pasted Vimeo/YouTube link — the
      // runtime URL-sniffs the provider (detectProvider in tg-pilot), same
      // convention as content/video.ts's VideoContent.videoUrl.
      url?: string
      autoplay?: boolean
    }
  | { kind: 'question'; question: Question }
  // Cosmetic countdown, client-local (no server authority, no advance-gating) —
  // distinct from phase.timer, which is server-driven and can auto-advance.
  | { kind: 'timer'; seconds: number; direction: 'up' | 'down' }
  // Short badge-style title. Renders overlaid on a slide's hero image when one
  // exists (see tg-pilot's StepBody); falls back to plain styled text otherwise.
  | { kind: 'heading'; text: string }

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
    z.object({
      qType: z.literal('order'),
      prompt: z.array(blockSchema),
      items: z.array(z.object({ id: z.string(), label: z.string() })),
    }),
    z.object({
      qType: z.literal('image_sequence'),
      prompt: z.array(blockSchema),
      images: z.array(z.object({ id: z.string(), mediaId: z.string() })),
    }),
  ]),
)

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), markdown: z.string() }),
    z.object({
      kind: z.literal('image'),
      mediaId: z.string(),
      url: z.string().optional(),
      caption: z.string().optional(),
    }),
    z.object({
      kind: z.literal('video'),
      mediaId: z.string(),
      url: z.string().optional(),
      autoplay: z.boolean().optional(),
    }),
    z.object({ kind: z.literal('question'), question: questionSchema }),
    z.object({
      kind: z.literal('timer'),
      seconds: z.number().int().positive(),
      direction: z.enum(['up', 'down']),
    }),
    z.object({ kind: z.literal('heading'), text: z.string() }),
  ]),
)
