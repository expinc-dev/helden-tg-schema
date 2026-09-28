import { z } from 'zod'

// Player: either one open-text response (char-limited) OR a structured
// two-field commitment (action + reason, "I will __, so that __" —
// BRIGHT-970), plus one 1-5 scale rating, no timer, explicit submit.
// self_paced, participation-scored (or scoring.mode:'none', set at the
// phase level) — see BLUEPRINT_runtime "Reflection" phase notes.
// Deliberately a single fixed prompt (not an array of arbitrary items) —
// that's what the phase asks for; a multi-prompt reflection is a different
// phase shape, not this one.
//
// `openText` and `commitment` are mutually exclusive authoring modes for the
// same phase type (see the refine below) rather than a discriminated union,
// so existing content (openText-only) keeps parsing unchanged — additive,
// MINOR bump.
const reflectionFieldSchema = z.object({
  label: z.string().optional(),
  maxLen: z.number().int().positive(),
})

export const reflectionContentSchema = z
  .object({
    type: z.literal('reflection'),
    prompt: z.string(),
    openText: reflectionFieldSchema.optional(),
    commitment: z
      .object({
        action: reflectionFieldSchema,
        reason: reflectionFieldSchema,
      })
      .optional(),
    scale: z.object({
      label: z.string().optional(),
      min: z.literal(1),
      max: z.literal(5),
      labels: z.tuple([z.string(), z.string()]).optional(),
    }),
  })
  .refine((c) => !!c.openText !== !!c.commitment, {
    message: 'reflection content must have exactly one of openText or commitment',
  })
export type ReflectionContent = z.infer<typeof reflectionContentSchema>
