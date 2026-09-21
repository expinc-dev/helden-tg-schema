import { z } from 'zod'

// Item bank — the jigsaw-board pieces. Each item has exactly one media
// representation, author-picked at author time. 'image'/'json' follow the
// mediaId + resolved-url-at-pick-time pattern used by Block.image (runtime
// never reads Firestore mid-session, so the public URL must travel inline).
export const unlockingItemMediaSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('image'), mediaId: z.string(), url: z.string().optional() }),
  z.object({ kind: z.literal('url'), url: z.string() }),
  z.object({ kind: z.literal('json'), mediaId: z.string(), url: z.string().optional() }),
])
export type UnlockingItemMedia = z.infer<typeof unlockingItemMediaSchema>

// Grid placement for the "assembled picture" puzzle board (PuzzleBoard in
// tg-pilot) — optional on purpose: items/content without it keep rendering
// as the classic flat card grid (ItemBoard), so existing authored content
// never breaks. col/row are 0-based cell coordinates within
// UnlockingContent.layout's grid; colSpan/rowSpan (default 1 each) let a
// single piece cover more than one cell, for an asymmetric/abstract mosaic
// rather than a uniform grid of equal squares.
export const unlockingItemPositionSchema = z.object({
  col: z.number().int().min(0),
  row: z.number().int().min(0),
  colSpan: z.number().int().min(1).optional(),
  rowSpan: z.number().int().min(1).optional(),
})
export type UnlockingItemPosition = z.infer<typeof unlockingItemPositionSchema>

export const unlockingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  media: unlockingItemMediaSchema.optional(),
  position: unlockingItemPositionSchema.optional(),
})
export type UnlockingItem = z.infer<typeof unlockingItemSchema>

// Accepted-word bank. Many-to-one with items — several synonyms may share the
// same itemId, but a single word always resolves to exactly one item.
export const unlockingWordSchema = z.object({
  id: z.string(),
  word: z.string(),
  itemId: z.string(),
})
export type UnlockingWord = z.infer<typeof unlockingWordSchema>

// One "question" in the phase. acceptedWordIds references unlockingWordSchema
// entries — matching any of them (case-insensitive + trim by default, see
// UnlockingContent.caseSensitive) unlocks that word's item on the central board.
export const unlockingStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  imageMediaId: z.string().optional(),
  imageUrl: z.string().optional(),
  acceptedWordIds: z.array(z.string()).min(1),
})
export type UnlockingStep = z.infer<typeof unlockingStepSchema>

// Overall grid dimensions for the assembled-picture puzzle board. Optional,
// sibling to each item's own optional `position` — both must be present for
// PuzzleBoard to render (a `layout` with items missing `position` falls back
// to the classic card grid too, same as `layout` being absent entirely).
export const unlockingLayoutSchema = z.object({
  columns: z.number().int().min(1),
  rows: z.number().int().min(1),
})
export type UnlockingLayout = z.infer<typeof unlockingLayoutSchema>

export const unlockingContentSchema = z.object({
  type: z.literal('unlocking'),
  items: z.array(unlockingItemSchema),
  words: z.array(unlockingWordSchema),
  steps: z.array(unlockingStepSchema),
  // Answer-matching mode against accepted words. Absent/false = case-insensitive
  // + trimmed (default), matching the codeinput.caseSensitive convention.
  caseSensitive: z.boolean().optional(),
  layout: unlockingLayoutSchema.optional(),
})
export type UnlockingContent = z.infer<typeof unlockingContentSchema>
