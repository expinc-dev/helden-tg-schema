import { z } from 'zod'

// Player: one open-text response (char-limited) + one 1-5 scale rating, no
// timer, explicit submit. self_paced, participation-scored — see
// BLUEPRINT_runtime "Reflection" phase notes. Deliberately a single fixed
// pair (not an array of arbitrary items) — that's what the phase asks for;
// a multi-prompt reflection is a different phase shape, not this one.
export const reflectionContentSchema = z.object({
  type: z.literal('reflection'),
  prompt: z.string(),
  openText: z.object({
    label: z.string().optional(),
    maxLen: z.number().int().positive(),
  }),
  scale: z.object({
    label: z.string().optional(),
    min: z.literal(1),
    max: z.literal(5),
    labels: z.tuple([z.string(), z.string()]).optional(),
  }),
})
export type ReflectionContent = z.infer<typeof reflectionContentSchema>
