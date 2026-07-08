import { z } from 'zod'
import { blockSchema } from '../blocks.js'

// MicroStep may have subSteps → z.lazy() self-reference.
export type MicroStep = {
  id: string
  blocks: import('../blocks.js').Block[]
  subSteps?: MicroStep[]
  gate?: { requireAnswered?: boolean }
}

export const microStepSchema: z.ZodType<MicroStep> = z.object({
  id: z.string(),
  blocks: z.array(blockSchema),
  subSteps: z.lazy(() => z.array(microStepSchema)).optional(),
  gate: z
    .object({
      requireAnswered: z.boolean().optional(),
    })
    .optional(),
})

export const microlearningContentSchema = z.object({
  type: z.literal('microlearning'),
  // sequential = onboarding-style step gate; free = show step index/menu.
  mode: z.enum(['sequential', 'free']),
  steps: z.array(microStepSchema),
})
export type MicrolearningContent = z.infer<typeof microlearningContentSchema>
