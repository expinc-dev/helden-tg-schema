import { z } from 'zod'
import { blockSchema } from '../blocks.js'

// A step is a sequence of blocks paginated one-per-screen at runtime — the
// player taps Next to walk through blocks[0..n-1] inside the step, then Next
// again at the last block advances to the next step. `thumbnailMediaId`/
// `thumbnailUrl` power the StepPicker card and are authored independently of
// any image block inside the step (so a text/question-only step still has
// artwork on the level card). Same mediaId+url pattern as Block.image,
// resolved at author pick-time — runtime reads url from the bundle, never
// Firestore.
export const microStepSchema = z.object({
  id: z.string(),
  blocks: z.array(blockSchema),
  thumbnailMediaId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  title: z.string().optional(),
  gate: z
    .object({
      requireAnswered: z.boolean().optional(),
    })
    .optional(),
})
export type MicroStep = z.infer<typeof microStepSchema>

export const microlearningContentSchema = z.object({
  type: z.literal('microlearning'),
  // sequential = onboarding-style step gate; free = show step index/menu.
  mode: z.enum(['sequential', 'free']),
  steps: z.array(microStepSchema),
})
export type MicrolearningContent = z.infer<typeof microlearningContentSchema>
