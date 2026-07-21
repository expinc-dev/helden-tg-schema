// Sanity-check examples. Run with `node --loader tsx src/__examples__/phases.example.ts`
// (or after build: `node dist/__examples__/phases.example.js`). Excluded from library build.
import { phaseSchema, type Phase } from '../phase.js'

const idlePhase: Phase = {
  id: 'p-idle',
  type: 'idle',
  title: 'Waiting room',
  syncMode: 'lockstep',
  roles: {
    player: { enabled: true },
    central: { enabled: true },
    host: { monitor: ['presence'] },
  },
  content: {
    type: 'idle',
    lottieMediaId: 'm-lottie-waiting',
    caption: 'Welcome',
  },
}

const microPhase: Phase = {
  id: 'p-intro',
  type: 'microlearning',
  title: 'Onboarding',
  syncMode: 'self_paced',
  roles: {
    player: { enabled: true },
    host: { monitor: ['progress'] },
  },
  content: {
    type: 'microlearning',
    mode: 'sequential',
    steps: [
      {
        id: 's1',
        blocks: [{ kind: 'text', markdown: '# Welcome' }],
      },
      {
        id: 's2',
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'single_choice',
              prompt: [{ kind: 'text', markdown: 'Ready?' }],
              options: [
                { id: 'a', label: 'Yes' },
                { id: 'b', label: 'No' },
              ],
              correctId: 'a',
            },
          },
        ],
        gate: { requireAnswered: true },
      },
    ],
  },
}

const reflectionPhase: Phase = {
  id: 'p-reflection',
  type: 'reflection',
  title: 'Reflection',
  syncMode: 'self_paced',
  scoring: { mode: 'participation', maxPoints: 10 },
  roles: {
    player: { enabled: true },
    host: { monitor: ['answers'] },
  },
  content: {
    type: 'reflection',
    prompt: 'What is one thing you will do differently after this session?',
    openText: { label: 'Your reflection', maxLen: 500 },
    scale: { label: 'How confident do you feel?', min: 1, max: 5, labels: ['Not at all', 'Very'] },
  },
}

for (const p of [idlePhase, microPhase, reflectionPhase]) {
  phaseSchema.parse(p)
  console.log(`OK ${p.id} (${p.type})`)
}
