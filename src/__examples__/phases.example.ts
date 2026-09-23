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
        title: 'Welcome',
        blocks: [
          { kind: 'text', markdown: '# Welcome' },
          { kind: 'button', variant: 'external-link', label: 'Baca panduan', url: 'https://example.com/guide' },
        ],
      },
      {
        id: 's2',
        title: 'Ready check',
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
      {
        id: 's3',
        title: 'Path question',
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'path_question',
              prompt: [{ kind: 'text', markdown: 'Solve both cases' }],
              cases: [
                { id: 'c1', label: 'Case A', task: [{ kind: 'text', markdown: 'Task A' }] },
                { id: 'c2', label: 'Case B', task: [{ kind: 'text', markdown: 'Task B' }], hidden: true },
              ],
              unlockAfterCases: 1,
            },
          },
        ],
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

// Host script (HLN-001). Host-only authoring: the host tablet renders
// `anchorScript` verbatim, poses `sharingPrompts` to the room, and shows the
// HOST IMPROVISATION banner when `improvMarker` is on. Every field optional —
// the phase above is the shape a bundle authored before this field existed.
const hostScriptPhase: Phase = {
  id: 'p-host-script',
  type: 'microlearning',
  title: 'Babak 1 — Material',
  syncMode: 'lockstep',
  roles: {
    player: { enabled: true },
    host: { monitor: ['presence', 'progress'] },
  },
  content: {
    type: 'microlearning',
    mode: 'sequential',
    steps: [{ id: 's1', blocks: [{ kind: 'text', markdown: 'Baca materi.' }] }],
  },
  hostScript: {
    anchorScript: [
      { kind: 'text', markdown: 'Bacakan: "Hari ini kita bicara soal AI di dapur."' },
      { kind: 'image', mediaId: 'media-cooking-frame' },
    ],
    sharingPrompts: [
      { kind: 'text', markdown: 'Tanyakan: apa satu alat dapur yang paling kamu andalkan?' },
      { kind: 'text', markdown: 'Giliran peserta berbagi — jangan isi sendiri.' },
    ],
    improvMarker: true,
  },
}

const unlockingPhase: Phase = {
  id: 'p-unlocking',
  type: 'unlocking',
  title: 'Cari Kata Kunci',
  syncMode: 'lockstep',
  scoring: { mode: 'participation', maxPoints: 10 },
  roles: {
    player: { enabled: true },
    central: { enabled: true },
    host: { monitor: ['answers', 'progress'] },
  },
  content: {
    type: 'unlocking',
    items: [
      {
        id: 'i-wajan',
        name: 'Wajan',
        description: 'Alat masak besi',
        media: { kind: 'image', mediaId: 'm-wajan' },
        // Exercises the optional puzzle-board placement fields alongside
        // `content.layout` below — colSpan: 2 makes this piece span two
        // columns, demonstrating the asymmetric/abstract mosaic case.
        position: { col: 0, row: 0, colSpan: 2, rowSpan: 1 },
      },
      {
        id: 'i-panci',
        name: 'Panci',
        media: { kind: 'url', url: 'https://example.com/panci.png' },
        position: { col: 2, row: 0, rowSpan: 2 },
      },
    ],
    words: [
      { id: 'w-wajan', word: 'wajan', itemId: 'i-wajan' },
      { id: 'w-frypan', word: 'frypan', itemId: 'i-wajan' },
      { id: 'w-panci', word: 'panci', itemId: 'i-panci' },
    ],
    steps: [
      {
        id: 's1',
        title: 'Alat masak berbahan besi, biasa dipakai menggoreng',
        acceptedWordIds: ['w-wajan', 'w-frypan'],
      },
      {
        id: 's2',
        title: 'Alat masak untuk merebus',
        acceptedWordIds: ['w-panci'],
      },
    ],
    layout: { columns: 3, rows: 2 },
  },
}

const worldBuildingPhase: Phase = {
  id: 'p-worldbuilding',
  type: 'worldbuilding',
  title: 'Future Game — Finale',
  syncMode: 'lockstep',
  scoring: { mode: 'none' },
  roles: {
    player: { enabled: true },
    central: { enabled: true },
    host: { monitor: ['answers'] },
  },
  content: {
    type: 'worldbuilding',
    steps: [
      { id: 'st-1', label: 'Intro text 1', kind: 'text', bodyText: 'patterns melting' },
      {
        id: 'st-2',
        label: 'Reveal base scene',
        kind: 'asset',
        media: { kind: 'image', mediaId: 'm-base-scene' },
      },
      {
        id: 'st-3',
        label: 'Vraag 1 — the stream',
        kind: 'question',
        questionText:
          'Noem één reactie die op zichzelf heel begrijpelijk is — maar die, als hij zich herhaalt, het verloop een andere kant op stuurt.',
      },
      {
        id: 'st-4',
        label: 'Vraag 1 — beaver 1 reveal',
        kind: 'asset',
        media: { kind: 'json', mediaId: 'm-beaver-1-lottie' },
      },
      {
        id: 'st-5',
        label: 'Vraag 3 — boss reveal stage 1 (no player input)',
        kind: 'text',
        bodyText: 'Elke game heeft een big boss...',
        hostNote:
          'Ask Jessica live: "Elke game heeft een big boss... wie is de big boss van deze future?"',
      },
      {
        id: 'st-6',
        label: 'Vraag 4 — magnifying glass icon',
        kind: 'asset',
        media: { kind: 'image', mediaId: 'm-icon-magnifier' },
        // HUD icon: fixed corner position (percent-based), accumulates
        // instead of replacing the scene — exercises placement/position
        // alongside the default (absent = 'scene') steps above.
        placement: 'hud',
        position: { x: 90, y: 10 },
      },
    ],
    closingPrompt: 'Wat ga je morgen anders doen?',
  },
}

for (const p of [
  idlePhase,
  microPhase,
  reflectionPhase,
  hostScriptPhase,
  unlockingPhase,
  worldBuildingPhase,
]) {
  phaseSchema.parse(p)
  console.log(`OK ${p.id} (${p.type})`)
}

// Host-only subset is optional all the way down: `hostScript: {}` is valid, and
// a phase that authorises no script at all stays valid (backward compatibility
// is what makes this a MINOR bump, not MAJOR).
phaseSchema.parse({ ...hostScriptPhase, hostScript: {} })
const { hostScript: _omitted, ...withoutHostScript } = hostScriptPhase
phaseSchema.parse(withoutHostScript)
console.log('OK hostScript is optional and fully backward-compatible')
