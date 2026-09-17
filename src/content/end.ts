import { z } from 'zod'

// End — marks a session as finished. All display fields are optional.
// By default the same title/text/image renders on central/player/host.
// Set `perDevice: true` to author each role separately via `central`/
// `player`/`host`; when a per-role field is absent the runtime falls
// back to the shared field of the same name.
const endRoleContentSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  imageMediaId: z.string().optional(),
})
export type EndRoleContent = z.infer<typeof endRoleContentSchema>

export const endContentSchema = z.object({
  type: z.literal('end'),
  title: z.string().optional(),
  text: z.string().optional(),
  imageMediaId: z.string().optional(),
  perDevice: z.boolean().optional(),
  central: endRoleContentSchema.optional(),
  player: endRoleContentSchema.optional(),
  host: endRoleContentSchema.optional(),
})
export type EndContent = z.infer<typeof endContentSchema>
