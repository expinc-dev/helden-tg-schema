import { z } from 'zod'

export const idleContentSchema = z.object({
  type: z.literal('idle'),
  lottieMediaId: z.string(),
  caption: z.string().optional(),
})
export type IdleContent = z.infer<typeof idleContentSchema>
