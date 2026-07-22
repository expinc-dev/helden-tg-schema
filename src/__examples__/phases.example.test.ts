// Proves the 8 example phases from the walkthrough PDF
// ("AI_Fundamentals_Training_Walkthrough.pdf", ref/) pass phaseSchema.parse().
// Fase 0-6 are single Phase objects; fase 7 ("Kunci Tim: Rakit Kode") is a paired
// codepiece + codeinput, so it contributes two Phase objects (7a, 7b) — 9 objects
// total across the document's 8 numbered fases. IDs/content copied verbatim from
// the PDF so this test traces directly back to that source, not invented data.
//
// Run via `npm test` (compiles under tsconfig.test.json, then runs the plain-JS
// output — see package.json). Not part of the library build (dist/), see
// tsconfig.json excludes.
/// <reference types="node" />
import assert from 'node:assert'
import { phaseSchema, type Phase } from '../phase.js'
import { publishedGameSchema } from '../published.js'
import { teamSchema, liveAggregatesSchema, type Team } from '../rtdb.js'
import { teamResultSchema, type TeamResult } from '../results.js'

// Fase 0 — Lobby / Pemanasan (idle, self_paced)
const phase0Lobby: Phase = {
  id: 'phase-0-lobby',
  type: 'idle',
  title: 'Lobby / Pemanasan',
  syncMode: 'self_paced',
  roles: {
    player: { enabled: true },
    central: { enabled: true },
    host: { monitor: ['presence'] },
  },
  content: {
    type: 'idle',
    lottieMediaId: 'media-lottie-brain-wave',
    caption: 'Menunggu peserta lain bergabung…',
  },
}

// Fase 1 — Selamat Datang & Tujuan (presentation, lockstep, controlledBy: host)
const phase1Welcome: Phase = {
  id: 'phase-1-welcome',
  type: 'presentation',
  title: 'Selamat Datang & Tujuan',
  syncMode: 'lockstep',
  roles: {
    central: { enabled: true },
    player: { enabled: true },
    host: { monitor: ['presence'] },
  },
  content: {
    type: 'presentation',
    controlledBy: 'host',
    slides: [
      {
        id: 's1',
        blocks: [
          { kind: 'text', markdown: '# Selamat datang di AI Fundamentals' },
          { kind: 'image', mediaId: 'media-hero-team-ai' },
        ],
      },
      {
        id: 's2',
        blocks: [
          {
            kind: 'text',
            markdown:
              '## Yang akan kita capai hari ini\n- Paham cara kerja AI generatif\n- Tahu batas & risikonya\n- Bisa menyusun prompt yang baik',
          },
        ],
      },
    ],
  },
}

// Fase 2 — Apa itu LLM? (microlearning, sequential, self_paced, with a gated question)
const phase2WhatIsLlm: Phase = {
  id: 'phase-2-what-is-llm',
  type: 'microlearning',
  title: 'Apa itu LLM?',
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
        id: 'm1',
        blocks: [
          {
            kind: 'text',
            markdown:
              '**LLM** (Large Language Model) memprediksi kata berikutnya berdasar pola dari data teks yang sangat besar.',
          },
          { kind: 'image', mediaId: 'media-next-token' },
        ],
      },
      {
        id: 'm2',
        blocks: [
          {
            kind: 'text',
            markdown:
              'Ia **tidak mengambil dari database fakta** — ia menghasilkan teks yang paling mungkin. Karena itu bisa terdengar meyakinkan tapi salah (*halusinasi*).',
          },
        ],
      },
      {
        id: 'm3',
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'single_choice',
              prompt: [{ kind: 'text', markdown: 'Kenapa AI bisa memberi jawaban salah yang terdengar yakin?' }],
              options: [
                { id: 'a', label: 'Ia memprediksi teks yang mungkin, bukan mengambil fakta' },
                { id: 'b', label: 'Database-nya sedang error' },
                { id: 'c', label: 'Ia sengaja berbohong' },
              ],
              correctId: 'a',
            },
          },
        ],
      },
      // 'order' and 'image_sequence' — microlearning-only Question variants,
      // formalized here out of tg-pilot's cast-at-the-boundary hack (see
      // OrderQuestion.tsx / ImageSequenceQuestion.tsx in that repo).
      {
        id: 'm4',
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'order',
              prompt: [{ kind: 'text', markdown: 'Urutkan langkah menulis prompt yang baik.' }],
              items: [
                { id: 'i1', label: 'Set the goal & context' },
                { id: 'i2', label: 'Give an example of the desired format' },
                { id: 'i3', label: 'Ask the AI to generate a draft' },
                { id: 'i4', label: 'Review & refine the result' },
              ],
            },
          },
        ],
      },
      {
        id: 'm5',
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'image_sequence',
              prompt: [{ kind: 'text', markdown: 'Seret gambar untuk membuat rangkaian cerita.' }],
              images: [
                { id: 'g1', mediaId: 'media-sequence-1' },
                { id: 'g2', mediaId: 'media-sequence-2' },
                { id: 'g3', mediaId: 'media-sequence-3' },
              ],
            },
          },
        ],
      },
    ],
  },
}

// Fase 3 — Nonton Bareng: AI di Alur Kerja (video, lockstep, watched together on central)
const phase3Video: Phase = {
  id: 'phase-3-video',
  type: 'video',
  title: 'AI di Alur Kerja Sehari-hari',
  syncMode: 'lockstep',
  roles: {
    central: { enabled: true },
    player: { enabled: true },
    host: { monitor: ['presence'] },
  },
  content: {
    type: 'video',
    mediaId: 'media-video-ai-workflow',
    target: ['central'],
    allowPlayerControl: false,
  },
}

// Fase 4 — Kuis Cepat / Kahoot-style (quiz, central_prompt, lockstep, server timer, graded)
const phase4QuizLive: Phase = {
  id: 'phase-4-quiz-live',
  type: 'quiz',
  title: 'Kuis Cepat',
  syncMode: 'lockstep',
  timer: { seconds: 20, authority: 'server', autoAdvanceOnExpire: true, visibleTo: ['central', 'player'] },
  scoring: {
    mode: 'correctness_and_speed',
    maxPoints: 1000,
    speedBonus: { maxBonus: 500, decaySeconds: 20 },
  },
  roles: {
    central: { enabled: true, showTimer: true, showResults: true },
    player: { enabled: true, showTimer: true },
    host: { monitor: ['answers', 'scores'] },
  },
  content: {
    type: 'quiz',
    mode: 'central_prompt',
    revealAnswers: true,
    perQuestionTimerSeconds: 20,
    questions: [
      {
        qType: 'single_choice',
        prompt: [{ kind: 'text', markdown: 'Data rahasia perusahaan sebaiknya…' }],
        options: [
          { id: 'a', label: 'Boleh ditempel ke AI publik asal cepat' },
          { id: 'b', label: 'Jangan ditempel ke AI publik' },
          { id: 'c', label: 'Boleh kalau dihapus setelahnya' },
        ],
        correctId: 'b',
      },
    ],
  },
}

// Fase 5 — Refleksi Pribadi (quiz, on_device, self_paced, participation-only, ungraded)
const phase5Reflection: Phase = {
  id: 'phase-5-reflection',
  type: 'quiz',
  title: 'Refleksi Pribadi',
  syncMode: 'self_paced',
  scoring: { mode: 'participation' },
  roles: {
    player: { enabled: true },
    host: { monitor: ['answers', 'progress'] },
  },
  content: {
    type: 'quiz',
    mode: 'on_device',
    revealAnswers: false,
    questions: [
      {
        qType: 'open_text',
        maxLen: 280,
        prompt: [{ kind: 'text', markdown: 'Satu tugas rutinmu yang bisa dibantu AI minggu ini?' }],
        rubricHint: "Cari jawaban konkret & spesifik, bukan 'semua tugas'.",
      },
      {
        qType: 'scale',
        min: 1,
        max: 5,
        labels: ['Belum yakin', 'Sangat yakin'],
        prompt: [{ kind: 'text', markdown: 'Seberapa yakin kamu memakai AI dengan aman?' }],
      },
    ],
  },
}

// Fase 6 — Mini-game: Urutkan Prompt (minigame, sort_order template, lockstep)
const phase6MinigameSort: Phase = {
  id: 'phase-6-minigame-sort',
  type: 'minigame',
  title: 'Urutkan Langkah Prompting',
  syncMode: 'lockstep',
  timer: { seconds: 45, authority: 'server', visibleTo: ['central', 'player'] },
  scoring: { mode: 'correctness_and_speed', maxPoints: 800 },
  roles: {
    player: { enabled: true, showTimer: true },
    central: { enabled: true, showResults: true },
    host: { monitor: ['scores'] },
  },
  content: {
    type: 'minigame',
    templateId: 'sort_order',
    config: {
      items: [
        { id: 'i1', label: 'Tentukan tujuan & konteks' },
        { id: 'i2', label: 'Beri contoh format yang diinginkan' },
        { id: 'i3', label: 'Minta AI menghasilkan draft' },
        { id: 'i4', label: 'Periksa & perbaiki hasil' },
      ],
      correctOrder: ['i1', 'i2', 'i3', 'i4'],
    },
  },
}

// Fase 7a — Kunci Tim: Rakit Kode, CodePiece half (fragments handed out on player devices)
const phase7aCodepiece: Phase = {
  id: 'phase-7a-codepiece',
  type: 'codepiece',
  title: 'Potongan Kodemu',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, host: { monitor: ['presence'] } },
  content: {
    type: 'codepiece',
    distribution: 'round_robin',
    hint: 'Gabungkan potongan seluruh tim sesuai nomor urutnya.',
    fragments: [
      { id: 'f1', value: 'SAFE' },
      { id: 'f2', value: '9' },
      { id: 'f3', value: 'AI' },
      { id: 'f4', value: '24' },
    ],
  },
}

// Fase 7b — Kunci Tim: Rakit Kode, CodeInput half (assembled code verified on central)
const phase7bCodeinput: Phase = {
  id: 'phase-7b-codeinput',
  type: 'codeinput',
  title: 'Buka Kunci Tim',
  syncMode: 'lockstep',
  roles: { central: { enabled: true }, host: { monitor: ['presence'] } },
  content: {
    type: 'codeinput',
    expected: 'SAFE9AI24',
    caseSensitive: false,
    maxAttempts: 5,
    sourcePhaseId: 'phase-7a-codepiece',
    onSuccess: { advance: true },
  },
}

// --- Team Mode ---------------------------------------------------------
// Not from the PDF (the walkthrough predates the team model) — added per the
// "Adds the team model" ticket. Proves teamMode on Phase, the Team roster shape,
// team-keyed results/aggregates (TeamResult, liveAggregates.teamScores) all validate.

const exampleTeam: Team = {
  ownerPlayerId: 'p-1',
  memberIds: { 'p-1': true, 'p-2': true, 'p-3': true },
  teamName: 'Alpha Squad',
  createdAt: 1730000000000,
}
teamSchema.parse(exampleTeam)
console.log('OK Team roster (ownerPlayerId + memberIds + teamName)')

// A team-mode variant of fase 6: same sort_order minigame, but teamMode:
// "team_collaborative" means the whole team submits one ranking and is scored
// as a unit, not one score per member.
const teamModePhase: Phase = {
  id: 'phase-team-sort',
  type: 'minigame',
  title: 'Team Challenge: Urutkan Langkah Prompting',
  syncMode: 'lockstep',
  teamMode: 'team_collaborative',
  timer: { seconds: 45, authority: 'server', visibleTo: ['central', 'player'] },
  scoring: { mode: 'correctness_and_speed', maxPoints: 800 },
  roles: {
    player: { enabled: true, showTimer: true },
    central: { enabled: true, showResults: true },
    host: { monitor: ['scores'] },
  },
  content: {
    type: 'minigame',
    templateId: 'sort_order',
    config: {
      items: [
        { id: 'i1', label: 'Tentukan tujuan & konteks' },
        { id: 'i2', label: 'Beri contoh format yang diinginkan' },
        { id: 'i3', label: 'Minta AI menghasilkan draft' },
        { id: 'i4', label: 'Periksa & perbaiki hasil' },
      ],
      correctOrder: ['i1', 'i2', 'i3', 'i4'],
    },
  },
}
const parsedTeamPhase = phaseSchema.parse(teamModePhase)
assert.strictEqual(parsedTeamPhase.teamMode, 'team_collaborative')
console.log(`OK ${teamModePhase.id} (${teamModePhase.type}, teamMode: ${teamModePhase.teamMode})`)

const exampleTeamResult: TeamResult = {
  teamId: 'team-alpha',
  sessionId: 'session-1',
  phaseResults: {
    'phase-team-sort': { score: 720, answers: { sort: ['i1', 'i2', 'i3', 'i4'] }, completedAt: 1730000045000 },
  },
}
teamResultSchema.parse(exampleTeamResult)
console.log('OK TeamResult (teamId-keyed, same phaseResults shape as PlayerResult)')

liveAggregatesSchema.parse({
  scores: { 'p-4': 410 }, // individual-mode phase elsewhere in the same session
  teamScores: { 'team-alpha': 720 }, // this team-mode phase
})
console.log('OK liveAggregates.teamScores parses alongside playerId-keyed scores')

const allPhases: Phase[] = [
  phase0Lobby,
  phase1Welcome,
  phase2WhatIsLlm,
  phase3Video,
  phase4QuizLive,
  phase5Reflection,
  phase6MinigameSort,
  phase7aCodepiece,
  phase7bCodeinput,
]

for (const p of allPhases) {
  const parsed = phaseSchema.parse(p)
  assert.strictEqual(parsed.type, p.type)
  console.log(`OK ${p.id} (${p.type})`)
}

// The PDF calls out this exact cross-phase relationship as the thing tg-cms must
// verify at publish time: fase 7a's fragments, joined, must equal fase 7b's `expected`.
// Not a schema-level rule (tg-cms's job per BLUEPRINT_cms §7) — asserted here only
// because the walkthrough's own example data should be internally consistent.
const assembled = phase7aCodepiece.content.type === 'codepiece'
  ? phase7aCodepiece.content.fragments.map((f) => f.value).join('')
  : ''
assert.strictEqual(
  phase7bCodeinput.content.type === 'codeinput' ? phase7bCodeinput.content.expected : undefined,
  assembled,
)
console.log(`OK fase 7 fragments assemble into "${assembled}" matching codeinput.expected`)

// Prove a fully-resolved bundle (what tg-cms publishes and tg-runtime loads) also validates.
publishedGameSchema.parse({
  id: 'v-1',
  gameId: 'g-ai-fundamentals',
  schemaVersion: '1.0.0',
  title: 'AI Fundamentals for the Workplace',
  phaseOrder: allPhases.map((p) => p.id),
  phases: Object.fromEntries(allPhases.map((p) => [p.id, p])),
  publishedAt: Date.now(),
  publishedBy: 'u-admin',
})
console.log('OK PublishedGame bundle assembled from all 8 walkthrough fases')

console.log(`All 8 walkthrough fases (${allPhases.length} phase objects) + bundle passed validation.`)
