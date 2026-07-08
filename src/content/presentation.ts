import { z } from 'zod'
import { blockSchema } from '../blocks.js'

export const presentationSlideSchema = z.object({
  id: z.string(),
  blocks: z.array(blockSchema),
})
export type PresentationSlide = z.infer<typeof presentationSlideSchema>

export const presentationContentSchema = z.object({
  type: z.literal('presentation'),
  slides: z.array(presentationSlideSchema),
  controlledBy: z.enum(['central', 'host']),
})
export type PresentationContent = z.infer<typeof presentationContentSchema>
