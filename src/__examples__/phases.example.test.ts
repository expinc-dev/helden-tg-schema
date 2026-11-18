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
import { normalQuizContentSchema } from '../content/normalquiz.js'
import { summaryContentSchema } from '../content/summary.js'
import { wordCloudContentSchema } from '../content/wordcloud.js'
import { phaseSchema, type Phase } from '../phase.js'
import { publishedGameSchema } from '../published.js'
import { teamSchema, liveAggregatesSchema, wordCloudLiveSchema, quizHostLiveSchema, type Team } from '../rtdb.js'
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
                { id: 'g3', mediaId: 'media-sequence-3', role: 'target' },
                { id: 'g4', mediaId: 'media-sequence-4', role: 'decoy' },
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

// --- Normal quiz ---------------------------------------------------------
// Not from the PDF — added with the `normalquiz` phase type (5.2.0). Self-paced,
// correctness-graded single_choice; kept out of `allPhases` so the "8 walkthrough
// fases" counts below stay true to the PDF.
const phaseNormalQuiz: Phase = {
  id: 'phase-normal-quiz',
  type: 'normalquiz',
  title: 'Kuis Biasa',
  syncMode: 'self_paced',
  scoring: { mode: 'correctness', maxPoints: 100 },
  roles: {
    player: { enabled: true },
    central: { enabled: true, showResults: true },
    host: { monitor: ['progress', 'scores', 'answers'] },
  },
  content: {
    type: 'normalquiz',
    revealAnswers: true,
    questions: [
      {
        qType: 'single_choice',
        prompt: [{ kind: 'text', markdown: 'Data rahasia perusahaan sebaiknya…' }],
        options: [
          { id: 'a', label: 'Boleh ditempel ke AI publik asal cepat' },
          { id: 'b', label: 'Jangan ditempel ke AI publik' },
        ],
        correctId: 'b',
      },
    ],
  },
}
assert.strictEqual(phaseSchema.parse(phaseNormalQuiz).type, 'normalquiz')
console.log(`OK ${phaseNormalQuiz.id} (${phaseNormalQuiz.type})`)

// revealAnswers is required (mirrors quiz) — a normalquiz without it must not parse.
assert.strictEqual(
  normalQuizContentSchema.safeParse({ type: 'normalquiz', questions: [] }).success,
  false,
)
console.log('OK normalquiz content without revealAnswers is rejected')

// --- Summary -------------------------------------------------------------
// Not from the PDF — added with the `summary` phase type (5.3.0). Every content
// field is optional, so a bare `{ type: 'summary' }` must parse too.
const phaseSummary: Phase = {
  id: 'phase-summary',
  type: 'summary',
  title: 'Ringkasan',
  syncMode: 'self_paced',
  roles: {
    player: { enabled: true },
    central: { enabled: true },
    host: { monitor: [] },
  },
  content: {
    type: 'summary',
    heading: 'Ringkasan',
    subtitle: 'Anda dapat mengunduh seluruh hasil dalam bentuk .pdf',
    downloadLabel: 'Kirim ke Whatsapp!',
    downloadDescription: 'Unduh seluruh hasil dan kirim ke whatsapp masing-masing!',
    pdfTitle: 'Perjalananmu',
    instructions: 'Hari ini kamu menulis apa yang paling makan waktu di usahamu.',
    closingLine: 'Kamu nggak butuh jadi ahli AI.',
    closingHighlight: 'Kamu cuma butuh tetap jadi kamu sambil alatnya bantu.',
  },
}
assert.strictEqual(phaseSchema.parse(phaseSummary).type, 'summary')
console.log(`OK ${phaseSummary.id} (${phaseSummary.type})`)
assert.strictEqual(summaryContentSchema.safeParse({ type: 'summary' }).success, true)
console.log('OK summary content with no authored copy parses')

// --- Word cloud ----------------------------------------------------------
// Not from the PDF — added with the `wordCloud` phase type (5.4.0). Uses the
// generic phase.timer (no word-cloud-specific timer field), has no scoring, and
// has no "number of words" setting. Kept out of `allPhases` like the other
// post-PDF phases.
const phaseWordCloud: Phase = {
  id: 'phase-word-cloud',
  type: 'wordCloud',
  title: 'Deel jouw ideeën!',
  syncMode: 'lockstep',
  timer: { seconds: 60, authority: 'host', autoAdvanceOnExpire: false, visibleTo: ['player', 'central'] },
  roles: {
    player: { enabled: true, showTimer: true },
    central: { enabled: true, showTimer: true },
    host: { monitor: ['presence', 'answers'] },
  },
  content: {
    type: 'wordCloud',
    prompt: {
      en: 'Which words come to mind on this topic? Enter your answers below and share them with the group.',
      nl: 'Welke woorden komen bij je op bij dit onderwerp? Vul je antwoorden hieronder in en deel ze met de groep.',
    },
    maxWordLen: 20,
  },
}
assert.strictEqual(phaseSchema.parse(phaseWordCloud).type, 'wordCloud')
console.log(`OK ${phaseWordCloud.id} (${phaseWordCloud.type}, with phase.timer)`)

const okPhase = (p: unknown) => phaseSchema.safeParse(p).success
assert.strictEqual(okPhase({ ...phaseWordCloud, timer: undefined }), true)
console.log('OK wordCloud phase without a timer parses (timer is optional)')

// No score: scoring absent or mode "none" passes, anything else is rejected.
assert.strictEqual(okPhase({ ...phaseWordCloud, scoring: { mode: 'none' } }), true)
assert.strictEqual(okPhase({ ...phaseWordCloud, scoring: { mode: 'participation' } }), false)
assert.strictEqual(okPhase({ ...phaseWordCloud, scoring: { mode: 'correctness', maxPoints: 10 } }), false)
console.log('OK wordCloud phase: scoring absent/"none" parses, other modes are rejected')

// phase.type and content.type must agree for a wordCloud...
assert.strictEqual(okPhase({ ...phaseWordCloud, type: 'idle' }), false)
assert.strictEqual(okPhase({ ...phaseWordCloud, content: { type: 'summary' } }), false)
// ...but that check is scoped to wordCloud: a mismatched legacy phase still parses.
assert.strictEqual(okPhase({ ...phase0Lobby, type: 'quiz' }), true)
console.log('OK wordCloud type/content mismatch is rejected; existing phases are not affected')

// prompt: en AND nl are both required and must not be blank.
const wcBase = phaseWordCloud.content
assert.strictEqual(wordCloudContentSchema.safeParse(wcBase).success, true)
assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, prompt: undefined }).success, false)
assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, prompt: { en: 'Only English' } }).success, false)
assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, prompt: { nl: 'Alleen Nederlands' } }).success, false)
assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, prompt: { en: '', nl: 'x' } }).success, false)
assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, prompt: { en: 'x', nl: '   ' } }).success, false)
console.log('OK wordCloud prompt needs a non-blank en and nl')

// maxWordLen: positive integer, required.
for (const bad of [0, -3, 2.5, undefined, '20']) {
  assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, maxWordLen: bad }).success, false)
}
assert.strictEqual(wordCloudContentSchema.safeParse({ ...wcBase, maxWordLen: 1 }).success, true)
console.log('OK wordCloud maxWordLen must be a positive integer')

// No "number of words" setting: an unknown `maxWords` key is not part of the shape
// (zod strips it), so nothing downstream can come to depend on it.
const strippedWc = wordCloudContentSchema.parse({ ...wcBase, maxWords: 5 })
assert.strictEqual('maxWords' in strippedWc, false)
console.log('OK wordCloud has no number-of-words setting')

// Live node (sessions/{sessionId}/wordCloud/{phaseId}): words + host moderation.
assert.strictEqual(wordCloudLiveSchema.safeParse({}).success, true) // RTDB drops empty objects
assert.strictEqual(
  wordCloudLiveSchema.safeParse({
    words: {
      w1: { playerId: 'p-1', text: 'Samenwerking', submittedAt: 1730000001000 },
      w2: { playerId: 'p-1', text: 'Veiligheid', submittedAt: 1730000002000 }, // one player, several words
    },
    hiddenWordIds: { w2: true },
  }).success,
  true,
)
assert.strictEqual(wordCloudLiveSchema.safeParse({ words: { w1: { playerId: 'p-1', submittedAt: 1 } } }).success, false)
assert.strictEqual(wordCloudLiveSchema.safeParse({ hiddenWordIds: { w1: false } }).success, false)
console.log('OK wordCloud live node (words + hiddenWordIds) validates')

// `closed` (5.5.0): host closed the input. true-or-absent, like hiddenWordIds.
assert.strictEqual(wordCloudLiveSchema.safeParse({ closed: true }).success, true)
assert.strictEqual(
  wordCloudLiveSchema.safeParse({
    words: { w1: { playerId: 'p-1', text: 'Samenwerking', submittedAt: 1730000001000 } },
    hiddenWordIds: { w1: true },
    closed: true,
  }).success,
  true,
)
// A node without `closed` (everything written before 5.5.0) still parses: input is open.
assert.strictEqual(
  wordCloudLiveSchema.safeParse({
    words: { w1: { playerId: 'p-1', text: 'Samenwerking', submittedAt: 1730000001000 } },
  }).success,
  true,
)
assert.strictEqual(wordCloudLiveSchema.safeParse({ closed: false }).success, false)
console.log('OK wordCloud live node closed flag: true parses, absent parses, false is rejected')

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

// --- Kennisquiz item scoring (5.6.0, BRIGHT-2861) -------------------------
// Examples from the COA Kennisquiz V3: "Keten" (+1 right / -1 wrong, block 1 q3)
// and the abbreviation meanings (tiers 5 -> 3, 8 -> 5, all 14 -> 7, block 4 q5).
const phaseKennisquizBlock: Phase = {
  id: 'phase-kennisquiz-blok-1',
  type: 'quiz',
  title: 'COA? COA!',
  syncMode: 'lockstep',
  teamMode: 'team_leader_only',
  scoring: { mode: 'correctness', maxPoints: 2 },
  roles: {
    player: { enabled: true, showTimer: true },
    central: { enabled: true, showTimer: true },
    host: { monitor: ['answers', 'scores'] },
  },
  content: {
    type: 'quiz',
    mode: 'central_prompt',
    revealAnswers: true,
    showBlockScore: true,
    questions: [
      {
        qType: 'multi_choice',
        prompt: [{ kind: 'text', markdown: 'Geef aan wat jullie taken zijn.' }],
        options: [
          { id: 'o-veilige-opvang', label: 'Veilige opvang' },
          { id: 'o-begeleiding', label: 'Begeleiding' },
          { id: 'o-studenten', label: 'Studenten begeleiden' },
        ],
        correctIds: ['o-veilige-opvang', 'o-begeleiding'],
        scoring: { rule: 'per_item', correctPoints: 1, wrongPenalty: 1 },
      },
      {
        qType: 'multi_choice',
        prompt: [{ kind: 'text', markdown: 'Wat betekenen de afkortingen?' }],
        options: [
          { id: 'o-1', label: 'COL' },
          { id: 'o-2', label: 'DOL' },
        ],
        correctIds: ['o-1', 'o-2'],
        scoring: {
          rule: 'tiers',
          tiers: [
            { minCorrect: 5, points: 3 },
            { minCorrect: 8, points: 5 },
            { minCorrect: 14, points: 7 },
          ],
        },
      },
    ],
  },
}
assert.strictEqual(phaseSchema.parse(phaseKennisquizBlock).type, 'quiz')
console.log(`OK ${phaseKennisquizBlock.id} (per_item +1/-1, tiers, showBlockScore)`)

// Rules: shape is checked, so a bad rule never reaches a published bundle.
const withScoring = (scoring: unknown): unknown => ({
  ...phaseKennisquizBlock,
  content: {
    ...phaseKennisquizBlock.content,
    questions: [{ ...(phaseKennisquizBlock.content as { questions: object[] }).questions[0], scoring }],
  },
})
assert.strictEqual(okPhase(withScoring({ rule: 'per_item', correctPoints: 1 })), true)
assert.strictEqual(okPhase(withScoring({ rule: 'per_item', correctPoints: 1, wrongPenalty: 1, allowNegativeTotal: true })), true)
assert.strictEqual(okPhase(withScoring({ rule: 'per_item', correctPoints: 1, wrongPenalty: -1 })), false)
assert.strictEqual(okPhase(withScoring({ rule: 'per_item' })), false)
assert.strictEqual(okPhase(withScoring({ rule: 'tiers', tiers: [] })), false)
assert.strictEqual(okPhase(withScoring({ rule: 'tiers', tiers: [{ minCorrect: 5, points: 3 }, { minCorrect: 5, points: 4 }] })), false)
assert.strictEqual(okPhase(withScoring({ rule: 'tiers', tiers: [{ minCorrect: 8, points: 5 }, { minCorrect: 5, points: 3 }] })), false)
assert.strictEqual(okPhase(withScoring({ rule: 'tiers', tiers: [{ minCorrect: 0, points: 1 }] })), false)
assert.strictEqual(okPhase(withScoring({ rule: 'unknown' })), false)
console.log('OK item scoring: per_item and tiers validate, malformed rules are rejected')

// Backward compatible: a multi_choice without `scoring` and a quiz without
// `showBlockScore` parse exactly as before 5.6.0.
assert.strictEqual(okPhase(withScoring(undefined)), true)
console.log('OK question without item scoring still parses (existing bundles unaffected)')

// --- Kennisquiz question types (5.6.0, BRIGHT-2853 .. 2859) ---------------
// One example per type, taken from the COA Kennisquiz V3 document.
const quizPhaseWith = (questions: unknown[], extra: object = {}): unknown => ({
  ...phaseKennisquizBlock,
  content: { ...phaseKennisquizBlock.content, questions },
  ...extra,
})
const okQuestion = (q: unknown) => okPhase(quizPhaseWith([q]))
const prompt = [{ kind: 'text', markdown: 'Vraag' }]

// 2853 matching — block 1 q5 (6 opvangvormen <-> afkorting), block 2 q3 (+1 / -1).
const qMatching = {
  qType: 'matching',
  prompt,
  items: [
    { id: 'i-pol', label: 'In afwachting van en tijdens asielprocedure' },
    { id: 'i-azc', label: 'Na afloop en tijdens verlengde asielprocedure' },
  ],
  targets: [
    { id: 't-pol', label: 'POL' },
    { id: 't-azc', label: 'AZC' },
  ],
  matches: [
    { itemId: 'i-pol', targetId: 't-pol' },
    { itemId: 'i-azc', targetId: 't-azc' },
  ],
  scoring: { rule: 'per_item', correctPoints: 1, wrongPenalty: 1 },
}
assert.strictEqual(okQuestion(qMatching), true)
assert.strictEqual(okQuestion({ ...qMatching, items: [] }), false)
assert.strictEqual(okQuestion({ ...qMatching, targets: [qMatching.targets[0]] }), false)
console.log('OK matching question (pairs, +1/-1) and its rejects')

// 2854 number_range — block 4 q1 (each number has a lowest and highest right value).
const qNumberRange = {
  qType: 'number_range',
  prompt,
  fields: [
    { id: 'f-vrijwilligers', label: 'Vrijwilligers', min: 1970, max: 2170 },
    { id: 'f-extern', label: 'Externe medewerkers', min: 750, max: 850 },
    { id: 'f-dienst', label: 'Medewerkers in dienst', min: 7500, max: 8300 },
    { id: 'f-totaal', label: 'Totaal', min: 10500, max: 11000 },
  ],
  scoring: { rule: 'per_item', correctPoints: 1 },
}
assert.strictEqual(okQuestion(qNumberRange), true)
assert.strictEqual(okQuestion({ ...qNumberRange, fields: [{ id: 'f', label: 'x', min: 10, max: 5 }] }), false)
assert.strictEqual(okQuestion({ ...qNumberRange, fields: [{ id: 'f', label: 'x' }] }), true) // draft: no range yet
assert.strictEqual(okQuestion({ ...qNumberRange, fields: [] }), false)
console.log('OK number_range question (min <= max, draft without range allowed)')

// 2855 swipe — block 5 "Even appen" (6 cards, tick or cross).
const qSwipe = {
  qType: 'swipe',
  prompt,
  sideLabels: { left: 'Kruisje', right: 'Vinkje' },
  cards: [
    { id: 'c-1', label: 'Een screenshot van een datalek delen in een groepsapp', correctSide: 'left' },
    { id: 'c-2', label: 'Vergrendel je scherm', correctSide: 'right' },
  ],
  scoring: { rule: 'per_item', correctPoints: 1 },
}
assert.strictEqual(okQuestion(qSwipe), true)
assert.strictEqual(okQuestion({ ...qSwipe, cards: [{ id: 'c', correctSide: 'up' }] }), false)
assert.strictEqual(okQuestion({ ...qSwipe, cards: [] }), false)
console.log('OK swipe question (cards with a right side)')

// 2856 blurred_sentences — block 1 q6 (Jong COA). Hit words sit behind {{hitId}}.
const qBlurred = {
  qType: 'blurred_sentences',
  prompt,
  sentences: [
    {
      id: 's-1',
      text: 'Jong COA is voor iedereen onder de {{h-36}} jaar.',
      hits: [{ id: 'h-36', word: '36' }],
    },
    {
      id: 's-2',
      text: 'De 3 V’s: {{h-v1}}, {{h-v2}} en {{h-v3}}.',
      hits: [
        { id: 'h-v1', word: 'versterken' },
        { id: 'h-v2', word: 'verbinden' },
        { id: 'h-v3', word: 'verdiepen' },
      ],
    },
  ],
  scoring: { rule: 'per_item', correctPoints: 1 },
}
assert.strictEqual(okQuestion(qBlurred), true)
assert.strictEqual(okQuestion({ ...qBlurred, sentences: [] }), false)
assert.strictEqual(okQuestion({ ...qBlurred, sentences: [{ id: 's', text: 'x' }] }), false)
console.log('OK blurred_sentences question (hit words behind {{hitId}} markers)')

// 2858 open_list — block 2 q4 (top 5, 5 points per filled answer).
const qOpenList = {
  qType: 'open_list',
  prompt,
  fieldCount: 5,
  fieldLabel: 'Energievreter',
  maxLen: 80,
  scoring: { rule: 'per_item', correctPoints: 5 },
}
assert.strictEqual(okQuestion(qOpenList), true)
assert.strictEqual(okQuestion({ ...qOpenList, fieldCount: 0 }), false)
assert.strictEqual(okQuestion({ ...qOpenList, scoring: undefined }), true) // no auto points
console.log('OK open_list question (5 fields, 5 points each)')

// 2859 yes_no_reason — block 3 q1 (3 choices + reason, 2 points for filling in).
const qYesNoReason = {
  qType: 'yes_no_reason',
  prompt,
  choices: [
    { id: 'c-ja', label: 'Ja' },
    { id: 'c-nee', label: 'Nee' },
    { id: 'c-oneens', label: 'We zijn het niet eens' },
  ],
  reasonLabel: 'Motiveer je antwoord',
  reasonMaxLen: 300,
  completionPoints: 2,
}
assert.strictEqual(okQuestion(qYesNoReason), true)
assert.strictEqual(okQuestion({ ...qYesNoReason, choices: [{ id: 'c', label: 'Ja' }] }), false)
assert.strictEqual(okQuestion({ ...qYesNoReason, completionPoints: -1 }), false)
console.log('OK yes_no_reason question (3 choices, completionPoints)')

// 2861 (5.7.0) order with item scoring — block 3 q5 / block 4 q4: 1 point per
// item at its right position. Without `scoring` it parses as before.
const qOrder = {
  qType: 'order',
  prompt,
  items: [
    { id: 'o-1', label: 'Feedback geven' },
    { id: 'o-2', label: 'Melden incident' },
    { id: 'o-3', label: 'Overplaatsing' },
  ],
  scoring: { rule: 'per_item', correctPoints: 1 },
}
assert.strictEqual(okQuestion(qOrder), true)
assert.strictEqual(okQuestion({ ...qOrder, scoring: undefined }), true)
assert.strictEqual(okQuestion({ ...qOrder, scoring: { rule: 'tiers', tiers: [{ minCorrect: 2, points: 2 }] } }), true)
assert.strictEqual(okQuestion({ ...qOrder, scoring: { rule: 'per_item' } }), false)
console.log('OK order question with item scoring (1 point per right position)')

// The new types also work together in one quiz phase, mixed with an old one.
assert.strictEqual(
  okPhase(quizPhaseWith([qMatching, qNumberRange, qSwipe, qBlurred, qOpenList, qYesNoReason, { qType: 'single_choice', prompt, options: [{ id: 'a', label: 'A' }], correctId: 'a' }])),
  true,
)
console.log('OK all Kennisquiz question types in one quiz phase')

// 2857 word cloud with blur + points by word count (1-3 = 1, 4-6 = 2, 7+ = 3).
const phaseWordCloudBlur = {
  ...phaseWordCloud,
  scoring: { mode: 'participation' },
  content: {
    ...phaseWordCloud.content,
    blurred: true,
    pointsByWordCount: [
      { minWords: 1, points: 1 },
      { minWords: 4, points: 2 },
      { minWords: 7, points: 3 },
    ],
  },
}
assert.strictEqual(okPhase(phaseWordCloudBlur), true)
// tiers need mode "participation"; tiers in the wrong order or empty are rejected
assert.strictEqual(okPhase({ ...phaseWordCloudBlur, scoring: undefined }), false)
assert.strictEqual(okPhase({ ...phaseWordCloudBlur, scoring: { mode: 'correctness', maxPoints: 3 } }), false)
assert.strictEqual(
  okPhase({ ...phaseWordCloudBlur, content: { ...phaseWordCloudBlur.content, pointsByWordCount: [] } }),
  false,
)
assert.strictEqual(
  okPhase({
    ...phaseWordCloudBlur,
    content: { ...phaseWordCloudBlur.content, pointsByWordCount: [{ minWords: 4, points: 2 }, { minWords: 1, points: 1 }] },
  }),
  false,
)
// blur alone changes nothing about scoring: still no score allowed
assert.strictEqual(okPhase({ ...phaseWordCloud, content: { ...phaseWordCloud.content, blurred: true } }), true)
assert.strictEqual(
  okPhase({ ...phaseWordCloud, scoring: { mode: 'participation' }, content: { ...phaseWordCloud.content, blurred: true } }),
  false,
)
console.log('OK wordCloud with blur + pointsByWordCount (old word clouds still have no score)')

// 2860 quizmaster tools: block notes on the host, live reveal state, block scores.
assert.strictEqual(
  okPhase({
    ...phaseKennisquizBlock,
    hostScript: { blockNotes: [{ kind: 'text', markdown: 'Na blok: uitleg verhaal Aeneas.' }] },
  }),
  true,
)
assert.strictEqual(quizHostLiveSchema.safeParse({}).success, true)
assert.strictEqual(quizHostLiveSchema.safeParse({ correctShown: { '0': true }, teamAnswersShownFor: '3' }).success, true)
assert.strictEqual(quizHostLiveSchema.safeParse({ correctShown: { '0': false } }).success, false)
assert.strictEqual(wordCloudLiveSchema.safeParse({ blurRemoved: true }).success, true)
assert.strictEqual(wordCloudLiveSchema.safeParse({ blurRemoved: false }).success, false)
assert.strictEqual(liveAggregatesSchema.safeParse({ blockScores: { 'phase-kennisquiz-blok-1': { 'team-a': 7 } } }).success, true)
console.log('OK quizmaster tools: blockNotes, quizHost live node, blurRemoved, blockScores')

// --- Block grouping (5.7.0): phases that share a blockId are one block -------
// Block 1 of the Kennisquiz = quiz phase + word cloud phase, one block score.
const blockQuiz = { ...phaseKennisquizBlock, blockId: 'blok-1' }
const blockCloud = { ...phaseWordCloudBlur, id: 'phase-kennisquiz-blok-1-cloud', blockId: 'blok-1' }
assert.strictEqual(okPhase(blockQuiz), true)
assert.strictEqual(okPhase(blockCloud), true)
assert.strictEqual(okPhase({ ...phaseKennisquizBlock, blockId: '' }), false)
assert.strictEqual(okPhase({ ...phaseKennisquizBlock, blockId: '   ' }), false)
assert.strictEqual(okPhase(phaseKennisquizBlock), true) // absent = its own block, as before
assert.strictEqual(
  publishedGameSchema.safeParse({
    id: 'v-block',
    gameId: 'g-kennisquiz',
    schemaVersion: '5.7.0',
    title: 'Kennisquiz',
    phaseOrder: [blockQuiz.id, blockCloud.id],
    phases: { [blockQuiz.id]: blockQuiz, [blockCloud.id]: blockCloud },
    publishedAt: Date.now(),
    publishedBy: 'u-admin',
  }).success,
  true,
)
console.log('OK block grouping: phases sharing a blockId parse, a blank blockId is rejected')

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
