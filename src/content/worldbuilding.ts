import { z } from 'zod'

// Media reference for a step's visual reveal — same shape/convention as
// unlockingItemMediaSchema (content/unlocking.ts): 'image'/'json' resolve
// mediaId -> url at author pick-time via the Media library, 'json' reuses
// the library's 'lottie' MediaType so an author can pick a Lottie animation
// file the same way they'd pick an image. Kept as its own local schema
// (not imported from unlocking.ts) so the two content types stay
// independently editable without coupling one's shape to the other's.
export const worldBuildingMediaSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('image'), mediaId: z.string(), url: z.string().optional() }),
  z.object({ kind: z.literal('json'), mediaId: z.string(), url: z.string().optional() }),
  z.object({ kind: z.literal('url'), url: z.string() }),
])
export type WorldBuildingMedia = z.infer<typeof worldBuildingMediaSchema>

// One entry in the operator's linear trigger list — a live, presenter-paced
// "world building" segment (base scene + layered reveals + audience
// freetext questions feeding a live ticker, no scoring, no player accounts).
// The order of `steps` IS the trigger order: the host/operator advances
// through them one at a time with a single "next" control; nothing here is
// automatic or content-triggered. `kind` picks which fields below apply:
//  - 'text'     — an intro/narration line shown on the central screen
//  - 'asset'    — a silent visual reveal (image or Lottie) layered onto the scene
//  - 'question' — also opens a freetext prompt on player phones + the live
//                 ticker; not every step has one (e.g. a live boss-reveal
//                 beat can be pure narration with no audience input)
export const worldBuildingStepSchema = z.object({
  id: z.string(),
  label: z.string(), // operator-facing name only, never shown to players
  kind: z.enum(['text', 'asset', 'question']),
  bodyText: z.string().optional(),
  media: worldBuildingMediaSchema.optional(),
  questionText: z.string().optional(),
  // Host-only cue for this specific step (e.g. the exact line to read aloud,
  // a reminder of what to do) — never sent to player devices, same
  // host-only contract as phase-level hostScript, just scoped to one step
  // instead of the whole phase. Optional: most steps don't need one.
  hostNote: z.string().optional(),
})
export type WorldBuildingStep = z.infer<typeof worldBuildingStepSchema>

export const worldBuildingContentSchema = z.object({
  type: z.literal('worldbuilding'),
  steps: z.array(worldBuildingStepSchema).min(1),
  // Closing screen, always last: the player types their own commitment text
  // into this prompt, sent onward via a WhatsApp deep link (wa.me) — not a
  // step/Vraag, and not scored or stored server-side.
  closingPrompt: z.string(),
})
export type WorldBuildingContent = z.infer<typeof worldBuildingContentSchema>
