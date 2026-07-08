import { z } from 'zod'
import { blockSchema } from '../blocks.js'

export const contentPageContentSchema = z.object({
  type: z.literal('content'),
  blocks: z.array(blockSchema),
})
export type ContentPageContent = z.infer<typeof contentPageContentSchema>
