import { z } from 'zod'
import { blockSchema } from '../blocks.js'

// One step = one block, always. Multi-block steps were collapsed into
// separate steps so the player advances one screen at a time with an explicit
// Next; `thumbnailMediaId`/`thumbnailUrl` power the StepPicker card and are
// authored independently of the block's own image (a text/question step still
// gets a card thumbnail). Same mediaId+url pattern as Block.image, resolved at
// author pick-time — runtime reads url from the bundle, never Firestore.
export const microStepSchema = z.object({
  id: z.string(),
  block: blockSchema,
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
