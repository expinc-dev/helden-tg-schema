import { z } from 'zod'
import { questionSchema } from '../blocks.js'

export const quizContentSchema = z.object({
  type: z.literal('quiz'),
  // on_device = Q&A on player; central_prompt = Q on central, answer field on player.
  mode: z.enum(['on_device', 'central_prompt']),
  questions: z.array(questionSchema),
  revealAnswers: z.boolean(),
  // 5.6.0: show the score of this quiz's block (a Kennisquiz block) to the players.
  // The block is the group of phases that share `phase.blockId` (5.7.0), or just this
  // phase when it has none. Absent/false = no block score, as before.
  showBlockScore: z.boolean().optional(),
  // 5.8.0 (Kennisquiz): when the right answers and each question's `review` are shown.
  // 'afterRound' = in the review after the last phase of the round (`phase.blockId`):
  // the tablets wait and the host clicks through the questions on the central screen.
  // 'afterQuestion' = right after each question (Ronde 6). Absent = no review step,
  // as before.
  reviewTiming: z.enum(['afterRound', 'afterQuestion']).optional(),
  // 5.8.0 (Kennisquiz Ronde 6): a wheel of fortune on the central screen picks the
  // next question. `labels[i]` is the topic of questions[i]; the wheel always stops
  // on the next question in order (the order is fixed, not random).
  wheel: z.object({ labels: z.array(z.string()).min(1) }).optional(),
  // Answering phase: options appear on player devices.
  answeringTimerSeconds: z.number().int().positive().optional(),
  // Legacy alias — treated as answeringTimerSeconds if answeringTimerSeconds absent.
  perQuestionTimerSeconds: z.number().int().positive().optional(),
})
export type QuizContent = z.infer<typeof quizContentSchema>
