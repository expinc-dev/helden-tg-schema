import { z } from 'zod'

export const videoContentSchema = z.object({
  type: z.literal('video'),
  mediaId: z.string(),
  // watch together (central) vs on-device (player).
  target: z.array(z.enum(['player', 'central'])),
  allowPlayerControl: z.boolean(),
})
export type VideoContent = z.infer<typeof videoContentSchema>
