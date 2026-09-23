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

// Percent-based (0-100), not pixels, so a HUD icon's position stays
// responsive across screen sizes. x/y name the position of the icon's
// CENTER point on screen (runtime centers the element on that point via
// translate(-50%, -50%), not its top-left corner).
export const worldBuildingPositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})
export type WorldBuildingPosition = z.infer<typeof worldBuildingPositionSchema>

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
  // Only meaningful when kind === 'asset'. 'scene' (default/absent) becomes
  // the persistent full-bleed background — the runtime keeps showing the
  // most recent 'scene' reveal underneath every later text/question step,
  // only replacing it when a NEW 'scene' asset step is reached (see
  // BLUEPRINT: each Lottie/GIF is authored to start exactly where the
  // previous one's last frame ended, so the "layering" is baked into the
  // assets themselves, not composited by the runtime). 'hud' is a small
  // fixed-position overlay icon (e.g. Vraag 4's magnifying glass/pause
  // icons) that ACCUMULATES instead of replacing the scene — once revealed
  // it stays on screen alongside any other 'hud' icons already revealed.
  placement: z.enum(['scene', 'hud']).optional(),
  // Only meaningful when placement === 'hud'. Absent = runtime falls back to
  // a default corner position rather than rendering at (0,0).
  position: worldBuildingPositionSchema.optional(),
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
