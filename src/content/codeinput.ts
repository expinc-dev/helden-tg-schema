import { z } from 'zod'

export const codeInputContentSchema = z.object({
  type: z.literal('codeinput'),
  expected: z.string(),
  caseSensitive: z.boolean().optional(),
  maxAttempts: z.number().int().positive().optional(),
  onSuccess: z.object({
    advance: z.boolean(),
  }),
  // Which CodePiece phase feeds this — used for cross-phase publish validation
  // (BLUEPRINT_cms §7: fragments must assemble into `expected`).
  sourcePhaseId: z.string().optional(),
})
export type CodeInputContent = z.infer<typeof codeInputContentSchema>
