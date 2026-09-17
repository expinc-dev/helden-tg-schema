import { z } from 'zod'

// End — marks a session as finished. All display fields are optional and
// shared across roles (central/player/host all render the same title/text/
// image). No interaction, no timer, no scoring.
export const endContentSchema = z.object({
  type: z.literal('end'),
  title: z.string().optional(),
  text: z.string().optional(),
  imageMediaId: z.string().optional(),
})
export type EndContent = z.infer<typeof endContentSchema>
