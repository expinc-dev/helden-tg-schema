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

for (const p of [idlePhase, microPhase]) {
  phaseSchema.parse(p)
  console.log(`OK ${p.id} (${p.type})`)
}
