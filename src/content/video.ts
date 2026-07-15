import { z } from 'zod'

export const videoContentSchema = z.object({
  type: z.literal('video'),
  mediaId: z.string(),
  // Pilot escape hatch until a real CMS media resolver ships. When set, the
  // runtime plays this URL directly and ignores mediaId. Accepts direct
  // MP4/HLS URLs (Azure CDN etc.) or Vimeo watch/embed URLs — the runtime
  // URL-sniffs the provider. Optional to stay backward-compatible with
  // pre-2.2 bundles.
  videoUrl: z.string().optional(),
  // watch together (central) vs on-device (player).
  target: z.array(z.enum(['player', 'central'])),
  allowPlayerControl: z.boolean(),
})
export type VideoContent = z.infer<typeof videoContentSchema>
