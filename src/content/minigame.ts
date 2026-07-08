import { z } from 'zod'

// Loose `config` here is intentional — each template's Zod lives in tg-runtime,
// registered by templateId. CLAUDE_tg-schema §Jangan lakukan allows this one loose spot.
export const miniGameContentSchema = z.object({
  type: z.literal('minigame'),
  templateId: z.string(),
  config: z.record(z.string(), z.unknown()),
})
export type MiniGameContent = z.infer<typeof miniGameContentSchema>
