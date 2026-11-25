// Team Choice example (5.11.0): a complete game where every team picks one of 3 options
// and then only sees the content for its option plus the shared content. It shows every
// place the new fields can sit:
//   - game.teamChoice                       (the options and the two rules)
//   - phase.onlyForOptions                  (a whole phase for one option)
//   - block.onlyForOptions                  (microlearning step, question prompt,
//                                            presentation slide, host script)
//   - codeinput.expectedByOption            (a different code per option)
// Validated by phases.example.test.ts. Excluded from the library build.
import type { Phase } from '../phase.js'
import type { PublishedGame } from '../published.js'
import type { TeamChoice } from '../teamchoice.js'

export const teamChoice: TeamChoice = {
  options: [
    {
      id: 'opt-bridge',
      name: 'Bridge crew',
      mediaId: 'media-bridge',
      mediaUrl: 'https://example.com/media/bridge.png',
    },
    {
      id: 'opt-tunnel',
      name: 'Tunnel crew',
      mediaId: 'media-tunnel',
      mediaUrl: 'https://example.com/media/tunnel.png',
    },
    // An option can also have no picture.
    { id: 'opt-tower', name: 'Tower crew' },
  ],
  required: true,
  allowSameOption: false,
}

// Shared by every team: no onlyForOptions anywhere.
export const phaseTeamChoiceIntro: Phase = {
  id: 'phase-tc-intro',
  type: 'idle',
  title: 'Pick your crew',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['presence'] } },
  content: {
    type: 'idle',
    lottieMediaId: 'm-lottie-waiting',
    caption: 'Every team picks one crew before we start.',
  },
}

// Shared phase, with blocks limited to some options. The phase is played by every team;
// each team only sees the shared blocks plus the blocks for its own option.
export const phaseTeamChoiceBriefing: Phase = {
  id: 'phase-tc-briefing',
  type: 'microlearning',
  title: 'Site briefing',
  syncMode: 'self_paced',
  teamMode: 'team_leader_only',
  roles: { player: { enabled: true }, host: { monitor: ['progress'] } },
  content: {
    type: 'microlearning',
    mode: 'sequential',
    steps: [
      {
        id: 's1',
        title: 'Your site',
        blocks: [
          { kind: 'text', markdown: 'Welcome. Read the briefing for your site.' },
          { kind: 'text', markdown: 'You work on a **bridge**.', onlyForOptions: ['opt-bridge'] },
          { kind: 'text', markdown: 'You work in a **tunnel**.', onlyForOptions: ['opt-tunnel'] },
          // One block can be for more than one option.
          {
            kind: 'image',
            mediaId: 'media-heights',
            showOn: ['player'],
            onlyForOptions: ['opt-bridge', 'opt-tower'],
          },
          {
            kind: 'question',
            question: {
              qType: 'single_choice',
              // A block inside a question prompt can be limited too.
              prompt: [
                { kind: 'text', markdown: 'What do you check first?' },
                { kind: 'text', markdown: 'Think of the scaffolding.', onlyForOptions: ['opt-tower'] },
              ],
              options: [
                { id: 'a', label: 'The anchor points' },
                { id: 'b', label: 'The weather' },
              ],
              correctId: 'a',
            },
            // The whole question block is for one option only.
            onlyForOptions: ['opt-bridge', 'opt-tower'],
          },
        ],
      },
    ],
  },
  // The host script follows the same rule: a block can be for one option only.
  hostScript: {
    anchorScript: [
      { kind: 'text', markdown: 'Read the briefing out loud.' },
      { kind: 'text', markdown: 'Bridge crew: mention the wind limit.', onlyForOptions: ['opt-bridge'] },
    ],
  },
}

// A presentation: a slide block (any block, not only the first) can be limited too.
export const phaseTeamChoicePresentation: Phase = {
  id: 'phase-tc-presentation',
  type: 'presentation',
  title: 'Safety rules',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['presence'] } },
  content: {
    type: 'presentation',
    controlledBy: 'host',
    slides: [
      {
        id: 'sl1',
        blocks: [
          { kind: 'heading', text: 'Safety rules' },
          { kind: 'text', markdown: 'Tunnel crew: check the air first.', onlyForOptions: ['opt-tunnel'] },
        ],
      },
    ],
  },
}

// A whole phase for one option. The other teams skip it (what they see meanwhile is a
// runtime decision, the phase pointer is shared by the session).
export const phaseTeamChoiceTunnelOnly: Phase = {
  id: 'phase-tc-tunnel-only',
  type: 'microlearning',
  title: 'Ventilation check',
  syncMode: 'self_paced',
  roles: { player: { enabled: true }, host: { monitor: ['progress'] } },
  onlyForOptions: ['opt-tunnel'],
  content: {
    type: 'microlearning',
    mode: 'sequential',
    steps: [{ id: 's1', title: 'Ventilation', blocks: [{ kind: 'text', markdown: 'Check the fans.' }] }],
  },
}

// A code input with a different code per option. `expected` is the fallback for a team
// without an option, or with an option that has no entry.
export const phaseTeamChoiceCode: Phase = {
  id: 'phase-tc-code',
  type: 'codeinput',
  title: 'Open the site gate',
  syncMode: 'lockstep',
  roles: { central: { enabled: true }, host: { monitor: ['presence'] } },
  content: {
    type: 'codeinput',
    expected: 'GATE-0',
    expectedByOption: {
      'opt-bridge': 'GATE-BRIDGE',
      'opt-tunnel': 'GATE-TUNNEL',
      'opt-tower': 'GATE-TOWER',
    },
    caseSensitive: false,
    maxAttempts: 5,
    onSuccess: { advance: true },
  },
}

export const teamChoicePhases: Phase[] = [
  phaseTeamChoiceIntro,
  phaseTeamChoiceBriefing,
  phaseTeamChoicePresentation,
  phaseTeamChoiceTunnelOnly,
  phaseTeamChoiceCode,
]

export const teamChoiceGame: PublishedGame = {
  id: 'v-tc-1',
  gameId: 'g-site-safety',
  schemaVersion: '5.11.0',
  title: 'Site safety with Team Choice',
  phaseOrder: teamChoicePhases.map((p) => p.id),
  flowMode: 'sequential',
  teamChoice,
  phases: Object.fromEntries(teamChoicePhases.map((p) => [p.id, p])),
  publishedAt: 1,
  publishedBy: 'u-admin',
}
