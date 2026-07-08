import { z } from 'zod'
import { questionSchema } from '../blocks.js'

export const quizContentSchema = z.object({
  type: z.literal('quiz'),
  // on_device = Q&A on player; central_prompt = Q on central, answer field on player.
  mode: z.enum(['on_device', 'central_prompt']),
  questions: z.array(questionSchema),
  revealAnswers: z.boolean(),
  perQuestionTimerSeconds: z.number().int().positive().optional(),
})
export type QuizContent = z.infer<typeof quizContentSchema>
