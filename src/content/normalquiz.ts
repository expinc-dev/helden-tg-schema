import { z } from 'zod'
import { questionSchema } from '../blocks.js'

// Normal quiz (not Kahoot): every player works through the questions at their own
// pace on their own device — self_paced, no shared step, no central question wall.
// The host monitors progress and grades; central only shows progress/statistics.
// Graded on correctness (single_choice with a correctId) — tg-cms restricts the
// question picker and hard-fails publish on anything else, so the schema stays
// wide (questionSchema) and can loosen later without a MAJOR bump.
export const normalQuizContentSchema = z.object({
  type: z.literal('normalquiz'),
  questions: z.array(questionSchema),
  // Show each player their right/wrong verdict per question once the host has
  // graded. false = only the total score is shown.
  revealAnswers: z.boolean(),
})
export type NormalQuizContent = z.infer<typeof normalQuizContentSchema>
