import { z } from 'zod'

export const videoContentSchema = z.object({
  type: z.literal('video'),
  mediaId: z.string(),
  // The playback source: runtime plays this URL directly and ignores
  // mediaId (mediaId is kept only for Media Library bookkeeping — see
  // tg-cms's VideoEditor). Accepts a CDN file URL, or a Vimeo/YouTube link —
  // the runtime URL-sniffs the provider (detectProvider in tg-pilot).
  // Optional to stay backward-compatible with pre-2.2 bundles.
  videoUrl: z.string().optional(),
  // watch together (central) vs on-device (player).
  target: z.array(z.enum(['player', 'central'])),
  allowPlayerControl: z.boolean(),
})
export type VideoContent = z.infer<typeof videoContentSchema>
