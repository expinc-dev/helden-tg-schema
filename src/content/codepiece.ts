import { z } from 'zod'

export const codePieceFragmentSchema = z.object({
  id: z.string(),
  value: z.string(),
  assignTo: z.string().optional(), // required when distribution = "fixed"
})
export type CodePieceFragment = z.infer<typeof codePieceFragmentSchema>

export const codePieceContentSchema = z.object({
  type: z.literal('codepiece'),
  distribution: z.enum(['fixed', 'round_robin', 'by_index']),
  fragments: z.array(codePieceFragmentSchema),
  hint: z.string().optional(),
})
export type CodePieceContent = z.infer<typeof codePieceContentSchema>
