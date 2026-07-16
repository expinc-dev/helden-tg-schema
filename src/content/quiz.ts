import { z } from 'zod'
import { questionSchema } from '../blocks.js'

export const quizContentSchema = z.object({
  type: z.literal('quiz'),
  // on_device = Q&A on player; central_prompt = Q on central, answer field on player.
  mode: z.enum(['on_device', 'central_prompt']),
  questions: z.array(questionSchema),
  revealAnswers: z.boolean(),
  // Reading phase: question shown on central, players see "look at main screen".
  readingTimerSeconds: z.number().int().positive().optional(),
  // Answering phase: options appear on player devices.
  answeringTimerSeconds: z.number().int().positive().optional(),
  // Legacy alias — treated as answeringTimerSeconds if answeringTimerSeconds absent.
  perQuestionTimerSeconds: z.number().int().positive().optional(),
})
export type QuizContent = z.infer<typeof quizContentSchema>
