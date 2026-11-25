import { z } from 'zod'

// Team Choice (5.11.0): a game can offer a list of options (e.g. four companies, four
// roles) and every team picks one before the first phase. Content can then be limited to
// some options (`onlyForOptions` on a phase or a block) and a code input can expect a
// different code per option (`expectedByOption`).
//
// This file is the data contract only. WHO may pick what, when a team picks, and which
// content a team sees are runtime decisions, not enforced by this shape.

const nonBlankString = z.string().refine((s) => s.trim().length > 0, { message: 'must not be blank' })

// An option id is used as a key in the live database (the claim node below, the per-option
// secrets) and as a key of `expectedByOption`. Realtime Database keys may not contain
// . $ # [ ] / or ASCII control characters (0-31, 127) and are at most 768 bytes; an id with
// a "/" would also write to a nested path. So the shape refuses what a key cannot hold,
// at publish time, instead of the game failing on the first write. 128 characters is far
// below the byte limit even for multi-byte text.
const OPTION_ID_MAX_LENGTH = 128
const RTDB_FORBIDDEN_KEY_CHARS = /[.$#[\]/\u0000-\u001f\u007f]/

export const optionIdSchema = z
  .string()
  .refine((s) => s.trim().length > 0, { message: 'option id must not be blank' })
  .refine((s) => s.length <= OPTION_ID_MAX_LENGTH, {
    message: `option id must be at most ${OPTION_ID_MAX_LENGTH} characters`,
  })
  .refine((s) => !RTDB_FORBIDDEN_KEY_CHARS.test(s), {
    message: 'option id must not contain . $ # [ ] / or control characters (it is used as a database key)',
  })
export type OptionId = z.infer<typeof optionIdSchema>

// One option a team can pick. `mediaId` is the picture (CMS bookkeeping) and `mediaUrl` its
// resolved public URL, copied at pick-time: the runtime shows the URL directly and never
// reads Firestore mid-session (same pattern as MatchItem.mediaUrl and Block.image.url).
// `mediaUrl` is rendered as an image source, so only http(s) is accepted: no javascript:,
// data: or file: URLs.
export const teamOptionSchema = z.object({
  id: optionIdSchema,
  name: nonBlankString,
  mediaId: z.string().optional(),
  mediaUrl: z
    .string()
    .refine((s) => /^https?:\/\//i.test(s), { message: 'mediaUrl must start with http:// or https://' })
    .optional(),
})
export type TeamOption = z.infer<typeof teamOptionSchema>

// The game-level Team Choice setting (GameDraft.teamChoice / PublishedGame.teamChoice).
// Absent = the game has no options and behaves exactly as before 5.11.0.
//  - `options`: at least 2 (a choice of one is no choice), ids unique within the game.
//  - `required`: every team must pick an option before the first phase.
//  - `allowSameOption`: two teams may pick the same option. When false, an option taken by
//    one team is unavailable to the others (the runtime enforces it, see
//    `optionClaimsSchema`).
export const teamChoiceSchema = z
  .object({
    options: z.array(teamOptionSchema).min(2),
    required: z.boolean(),
    allowSameOption: z.boolean(),
  })
  .superRefine((choice, ctx) => {
    const seen = new Set<string>()
    choice.options.forEach((option, index) => {
      if (seen.has(option.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', index, 'id'],
          message: `duplicate option id "${option.id}"`,
        })
      }
      seen.add(option.id)
    })
  })
export type TeamChoice = z.infer<typeof teamChoiceSchema>

// The ids a phase or a block is limited to ("only for these options"). Absent = shown for
// every option. An empty list is rejected: it would mean "for nobody", and the way to hide
// something is to not author it. A team without an option (it has not picked, or the game
// has no Team Choice) only sees content WITHOUT this field.
export const optionIdsSchema = z.array(optionIdSchema).min(1)
export type OptionIds = z.infer<typeof optionIdsSchema>

// sessions/{sessionId}/optionClaims: optionId -> teamId of the team that took the option.
// The runtime uses it when `allowSameOption` is false, so "option already taken" does not
// race between two teams picking at the same moment (security rules cannot read other
// teams, they can only make a claim write-once). A MAP keyed by option id, not an array,
// for the same reason as Team.memberIds: a per-key write-once rule is all RTDB rules can
// express. Absent while no option has been claimed (RTDB does not store an empty object).
export const optionClaimsSchema = z.record(optionIdSchema, z.string())
export type OptionClaims = z.infer<typeof optionClaimsSchema>

// Where an option id is referenced from inside a tree of phases or blocks.
export type OptionRef = {
  optionId: string
  // Path from the walked value to the reference (to the list entry of onlyForOptions, or
  // to the key of expectedByOption), so an issue can point at the exact place.
  path: (string | number)[]
}

// Collects every option id a value refers to: the entries of any `onlyForOptions` array
// and the keys of any `expectedByOption` object, wherever they sit. Deliberately generic
// instead of one walker per content type: blocks nest (question prompts, host scripts,
// microlearning steps, presentation slides, path_question tasks), and a walker per type
// would silently miss the next place a block is added. Used by publishedGameSchema to check
// the references against the game's options. It is validation only: it never writes, and it
// reads only own enumerable keys.
export function collectOptionRefs(value: unknown): OptionRef[] {
  const refs: OptionRef[] = []
  const walk = (node: unknown, path: (string | number)[]): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...path, index]))
      return
    }
    if (node === null || typeof node !== 'object') return
    for (const [key, child] of Object.entries(node)) {
      if (key === 'onlyForOptions' && Array.isArray(child)) {
        child.forEach((id, index) => {
          if (typeof id === 'string') refs.push({ optionId: id, path: [...path, key, index] })
        })
      } else if (key === 'expectedByOption' && child !== null && typeof child === 'object' && !Array.isArray(child)) {
        for (const id of Object.keys(child)) refs.push({ optionId: id, path: [...path, key, id] })
      } else {
        walk(child, [...path, key])
      }
    }
  }
  walk(value, [])
  return refs
}
