import { z } from 'zod'
import { itemScoringSchema, type ItemScoring } from './itemscoring.js'
import { optionIdsSchema } from './teamchoice.js'

// Block ↔ Question is mutually recursive (a question's prompt is Block[],
// and a Block can be a question). We declare the TS types first, then annotate
// the schemas with z.ZodType<T> so tsc doesn't choke on the self-reference.

// isOther marks the free-text "Lainnya" option of a single_choice question:
// the runtime opens an inline text field under it. It replaces matching the
// label text, so the label is free to read however the author wants.
// otherPlaceholder is that field's placeholder; only meaningful with isOther.
export type Choice = {
  id: string
  label: string
  mediaId?: string
  isOther?: boolean
  otherPlaceholder?: string
}

// Retry-scoring for qr_scan/pattern_scan — deliberately local to these two
// qTypes, not the phase-level ScoringConfig (which has no per-attempt-penalty
// concept and is one config per whole phase, not per question).
export type ScanPoints = { correct: number; wrongPenalty: number }

// 5.8.0: fields every question type may carry.
// `review` = what the central screen shows for this question in the review of the
// round (the Kennisquiz "AFTER THE ROUND" content: the right answer explained, an
// answer picture such as the filled-in organogram). Host/central only: stripped
// from the player-safe bundle, like an answer key.
export type QuestionCommon = { review?: Block[] }

export type Question = QuestionBody & QuestionCommon

export type QuestionBody =
  | { qType: 'single_choice'; prompt: Block[]; options: Choice[]; correctId?: string }
  // `scoring` (5.6.0): optional per-item rule (+/- per option, or tiers by number
  // of right options). Absent = the phase-level ScoringConfig applies as before.
  // `exactChoices` (5.8.0): the team must pick exactly this many options and cannot
  // pick more (Kennisquiz Ronde 5 vraag 4: exactly 3).
  | {
      qType: 'multi_choice'
      prompt: Block[]
      options: Choice[]
      correctIds?: string[]
      exactChoices?: number
      scoring?: ItemScoring
    }
  // `scoring` (5.8.0): only `manual` makes sense here (points from the quizmaster).
  | {
      qType: 'open_text'
      prompt: Block[]
      maxLen?: number
      rubricHint?: string
      scoring?: ItemScoring
    }
  | {
      qType: 'scale'
      prompt: Block[]
      min: number
      max: number
      labels?: [string, string]
    }
  | {
      qType: 'short_answer'
      prompt: Block[]
      acceptedAnswers?: string[]
      caseSensitive?: boolean
    }
  // Formalized out of tg-pilot's microlearning-only cast-at-the-boundary hack
  // (OrderQuestion.tsx / ImageSequenceQuestion.tsx — `as unknown as Question`).
  // Drag-to-reorder a fixed list.
  //
  // `scoring` (5.7.0): optional per-item rule where a "right item" is an item placed
  // at its authored position (1 point per right position in the Kennisquiz) and a
  // "wrong item" is one placed elsewhere; `tiers` count right positions. Absent =
  // the phase-level ScoringConfig applies as before (whole order must be right).
  // 5.8.0: an item may be a picture (`mediaId`, e.g. a flag) and `shuffle` shows
  // the items in a random order to each team.
  | {
      qType: 'order'
      prompt: Block[]
      items: { id: string; label: string; mediaId?: string; mediaUrl?: string }[]
      shuffle?: boolean
      scoring?: ItemScoring
    }
  // Drag pool images into numbered slots (slots start empty, unlike 'order'
  // which reorders a pre-placed list).
  //
  // images[] order of the non-decoy items = the correct answer order. role
  // 'decoy' images are shown in the pool but get no slot and are not part of the
  // answer; role defaults to 'target' when omitted (data from before 5.1.0).
  | {
      qType: 'image_sequence'
      prompt: Block[]
      images: { id: string; mediaId: string; role?: 'decoy' | 'target' }[]
    }
  // Player assembles a physical puzzle, then scans the result. referenceMediaId
  // is shown to the player as "what to build"; expectedValue is the QR payload
  // to match (author-typed, decoded QR images aren't auto-read at author time).
  // referenceUrl is the resolved public URL, copied from the picked MediaDoc
  // at pick-time — same pattern as Block.image.url, since runtime never reads
  // Firestore mid-session and can only render what's inline in the bundle.
  | {
      qType: 'qr_scan'
      prompt: Block[]
      referenceMediaId: string
      referenceUrl?: string
      expectedValue: string
      points?: ScanPoints
    }
  // Same physical-scan flow as qr_scan, but the "answer" is the reference image
  // itself — runtime hashes the targetUrl image and compares it to the scanned
  // frame, no separately-authored expected value.
  | {
      qType: 'pattern_scan'
      prompt: Block[]
      targetMediaId: string
      targetUrl?: string
      points?: ScanPoints
    }
  | {
      qType: 'path_question'
      prompt: Block[]
      cases: {
        id: string
        label: string
        task: Block[]
        maxLen?: number
        hidden?: boolean
      }[]
      unlockAfterCases: number
    }
  // ---- 5.6.0: COA Kennisquiz question types (BRIGHT-2853 .. 2859) ----------
  // Player links every `item` to one of the `targets`. Several items may share one
  // target (e.g. 8 topics over 4 batteries). `matches` is the ANSWER KEY (itemId ->
  // targetId, one entry per item): author-time only, stripped from the player-safe
  // bundle. Answer value (runtime): { [itemId]: targetId }. Scoring: `per_item`
  // counts a right pair as a right item and a wrong link as a wrong item.
  // 5.8.0: `targetCapacity` = how many items one target takes at most (Kennisquiz:
  // exactly 2 topics per battery); absent = no limit. `shuffle` shows the items in a
  // random order. A true/false list is a matching with two targets ("waar" / "niet waar").
  | {
      qType: 'matching'
      prompt: Block[]
      items: MatchItem[]
      targets: MatchItem[]
      matches?: { itemId: string; targetId: string }[]
      targetCapacity?: number
      shuffle?: boolean
      scoring?: ItemScoring
    }
  // One numeric field per `fields` entry; a number is right when it lies in
  // [min, max] inclusive. min/max are the ANSWER KEY, stripped from the player-safe
  // bundle. Answer value (runtime): { [fieldId]: number }. `per_item` counts each
  // number inside its range as a right item (a wrong number costs the penalty, if any).
  // 5.8.0: with `labels`, the fields are unnamed bars of a chart: the team first drags
  // each label onto a bar, then fills in a number per bar. `fields[].correctLabelId`
  // is the ANSWER KEY for the labels (stripped like min/max); a right label counts as
  // one more right item. Answer value then: { values: {[fieldId]: number},
  // labels: {[fieldId]: labelId} }.
  | {
      qType: 'number_range'
      prompt: Block[]
      fields: NumberRangeField[]
      labels?: MatchItem[]
      scoring?: ItemScoring
    }
  // Cards swiped to one of two sides. `correctSide` per card is the ANSWER KEY,
  // stripped from the player-safe bundle. `sideLabels` are the two side captions
  // (e.g. a cross / a tick). Answer value (runtime): { [cardId]: 'left' | 'right' }.
  // 5.8.0: `shuffle` shows the cards in a random order.
  | {
      qType: 'swipe'
      prompt: Block[]
      cards: SwipeCard[]
      sideLabels?: { left: string; right: string }
      shuffle?: boolean
      scoring?: ItemScoring
    }
  // Sentences shown blurred; the player finds the "hit" words. `text` holds the
  // sentence with a `{{hitId}}` marker where each hit word sits, and `hits` maps
  // hitId -> word. `hits[].word` is the ANSWER KEY: the player-safe bundle keeps the
  // `{{hitId}}` markers but drops the words, so the words are not in the file the
  // players get. Answer value (runtime): { [sentenceId]: string[] } = hit ids found.
  // `per_item` counts each found hit as a right item.
  | {
      qType: 'blurred_sentences'
      prompt: Block[]
      sentences: BlurredSentence[]
      scoring?: ItemScoring
    }
  // A list of `fieldCount` free-text answers (top 5, a list of themes). There is no
  // right or wrong and no text check: each FILLED field is one "right item", so
  // `per_item` { correctPoints: 5 } = 5 points per filled answer. Team answers are
  // shown to the room by the quizmaster (see QuizHostLive).
  // Answer value (runtime): string[] (length <= fieldCount).
  // 5.8.0: `openEnded` = the team may add entries beyond `fieldCount` (Kennisquiz:
  // "as many RI&E themes as you can"); `fieldCount` is then the number of fields shown
  // at the start. `fields` = one named field per entry (e.g. one per abbreviation, to
  // type its meaning); when set, the list has exactly these fields and `fieldCount`
  // must equal fields.length. With `fields`, the answer value is { [fieldId]: string }.
  | {
      qType: 'open_list'
      prompt: Block[]
      fieldCount: number
      fieldLabel?: string
      fields?: { id: string; label: string }[]
      openEnded?: boolean
      maxLen?: number
      scoring?: ItemScoring
    }
  // A choice (yes / no / ... ) plus a written reason. No right or wrong.
  // `completionPoints` are given when BOTH the choice and the reason are filled.
  // Answer value (runtime): { choiceId: string; reason: string }.
  | {
      qType: 'yes_no_reason'
      prompt: Block[]
      choices: Choice[]
      reasonLabel?: string
      reasonMaxLen?: number
      completionPoints?: number
    }

// 5.8.0: `mediaUrl` = the resolved public URL of `mediaId`, copied at pick-time (same
// pattern as Block.image.url): the runtime shows it directly, it never reads Firestore.
export type MatchItem = { id: string; label: string; mediaId?: string; mediaUrl?: string }
export type NumberRangeField = {
  id: string
  label: string
  unit?: string
  min?: number
  max?: number
  correctLabelId?: string
}
export type SwipeCard = {
  id: string
  label?: string
  mediaId?: string
  mediaUrl?: string
  correctSide?: 'left' | 'right'
}
// 5.8.0: a hit word may be several words ("de helft van alle medewerkers"); `accepted`
// lists other spellings that also count (ANSWER KEY, stripped with `word`). The runtime
// compares without regard to capitals and extra spaces.
export type BlurredHit = { id: string; word: string; accepted?: string[] }
export type BlurredSentence = { id: string; text: string; hits: BlurredHit[] }

// 5.9.0: the three runtime roles an image block can be limited to (Block.image.showOn).
export const blockRoleSchema = z.enum(['host', 'central', 'player'])
export type BlockRole = z.infer<typeof blockRoleSchema>

// 5.11.0: fields every block kind may carry (same pattern as QuestionCommon above).
// `onlyForOptions` = the Team Choice option ids this block is shown for. Absent = shown
// for every option (and for a team that has no option); a list of 1 or more ids limits it
// to teams that picked one of them; an empty list is rejected. A team without an option
// only sees blocks WITHOUT this field. Hiding is the runtime's job and applies where the
// block is rendered: the block stays in the bundle, so it is not a secret (use
// `expectedByOption` for answer keys). The CMS should write the field only when the author
// limits the block, so content written before 5.11.0 is untouched.
export type BlockCommon = { onlyForOptions?: string[] }

export type Block = BlockBody & BlockCommon

export type BlockBody =
  | { kind: 'text'; markdown: string }
  | {
      kind: 'image'
      mediaId: string
      // Resolved public URL, copied from the picked MediaDoc at pick-time.
      // Runtime renders this directly; mediaId is kept for CMS bookkeeping only.
      url?: string
      // Short bold headline shown below the image (e.g. "Cari & Susun Balok").
      // Distinct from caption: title is a heading-style label, caption is a
      // small secondary note — both optional, both can be present at once.
      title?: string
      caption?: string
      // 5.9.0: the roles that show this image. Absent = every role (host, central,
      // player), so content written before 5.9.0 keeps showing everywhere. An empty
      // list shows it nowhere. The CMS writes it only when the author unticks a role.
      showOn?: BlockRole[]
    }
  | {
      kind: 'video'
      mediaId: string
      // Same resolved-at-pick-time pattern as image.url. Accepts a CDN file
      // URL from an uploaded MediaDoc, or a pasted Vimeo/YouTube link — the
      // runtime URL-sniffs the provider (detectProvider in tg-pilot), same
      // convention as content/video.ts's VideoContent.videoUrl.
      url?: string
      autoplay?: boolean
    }
  | { kind: 'question'; question: Question }
  // Cosmetic countdown, client-local (no server authority, no advance-gating) —
  // distinct from phase.timer, which is server-driven and can auto-advance.
  | { kind: 'timer'; seconds: number; direction: 'up' | 'down' }
  // Short badge-style title. Renders overlaid on a slide's hero image when one
  // exists (see tg-pilot's StepBody); falls back to plain styled text otherwise.
  | { kind: 'heading'; text: string }
  // Raw HTML, author-trusted (CMS-authored content, not third-party input).
  | { kind: 'html'; html: string }
  // 'copy' copies `text` to clipboard; 'external-link' opens `url` in a new tab.
  // `description` is the short line shown under an external-link button's label
  // (the Gemini link card); the runtime falls back to its built-in text when omitted.
  | {
      kind: 'button'
      variant: 'copy' | 'external-link'
      label: string
      text?: string
      url?: string
      description?: string
    }

export const choiceSchema: z.ZodType<Choice> = z.object({
  id: z.string(),
  label: z.string(),
  mediaId: z.string().optional(),
  isOther: z.boolean().optional(),
  otherPlaceholder: z.string().optional(),
})

export const matchItemSchema: z.ZodType<MatchItem> = z.object({
  id: z.string(),
  label: z.string(),
  mediaId: z.string().optional(),
  mediaUrl: z.string().optional(),
})

// min <= max when both are authored. Either may be absent while a draft is being
// written (they are the answer key, like single_choice.correctId).
export const numberRangeFieldSchema: z.ZodType<NumberRangeField> = z
  .object({
    id: z.string(),
    label: z.string(),
    unit: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    correctLabelId: z.string().optional(),
  })
  .refine((f) => f.min === undefined || f.max === undefined || f.min <= f.max, {
    message: 'min must be less than or equal to max',
    path: ['min'],
  })

export const swipeCardSchema: z.ZodType<SwipeCard> = z.object({
  id: z.string(),
  label: z.string().optional(),
  mediaId: z.string().optional(),
  mediaUrl: z.string().optional(),
  correctSide: z.enum(['left', 'right']).optional(),
})

export const blurredSentenceSchema: z.ZodType<BlurredSentence> = z.object({
  id: z.string(),
  text: z.string(),
  hits: z.array(
    z.object({ id: z.string(), word: z.string(), accepted: z.array(z.string()).optional() }),
  ),
})

export const scanPointsSchema: z.ZodType<ScanPoints> = z.object({
  correct: z.number().nonnegative(),
  wrongPenalty: z.number().nonnegative(),
})

export const questionSchema: z.ZodType<Question> = z.lazy(() =>
  z.intersection(questionBodySchema, z.object({ review: z.array(blockSchema).optional() })),
)

const questionBodySchema: z.ZodType<QuestionBody> = z.lazy(() =>
  z.discriminatedUnion('qType', [
    z.object({
      qType: z.literal('single_choice'),
      prompt: z.array(blockSchema),
      options: z.array(choiceSchema),
      correctId: z.string().optional(),
    }),
    z.object({
      qType: z.literal('multi_choice'),
      prompt: z.array(blockSchema),
      options: z.array(choiceSchema),
      correctIds: z.array(z.string()).optional(),
      exactChoices: z.number().int().positive().optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('open_text'),
      prompt: z.array(blockSchema),
      maxLen: z.number().int().positive().optional(),
      rubricHint: z.string().optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('scale'),
      prompt: z.array(blockSchema),
      min: z.number().int(),
      max: z.number().int(),
      labels: z.tuple([z.string(), z.string()]).optional(),
    }),
    z.object({
      qType: z.literal('short_answer'),
      prompt: z.array(blockSchema),
      acceptedAnswers: z.array(z.string()).optional(),
      caseSensitive: z.boolean().optional(),
    }),
    z.object({
      qType: z.literal('order'),
      prompt: z.array(blockSchema),
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          mediaId: z.string().optional(),
          mediaUrl: z.string().optional(),
        }),
      ),
      shuffle: z.boolean().optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('image_sequence'),
      prompt: z.array(blockSchema),
      images: z.array(
        z.object({
          id: z.string(),
          mediaId: z.string(),
          role: z.enum(['decoy', 'target']).optional(),
        }),
      ),
    }),
    z.object({
      qType: z.literal('qr_scan'),
      prompt: z.array(blockSchema),
      referenceMediaId: z.string(),
      referenceUrl: z.string().optional(),
      expectedValue: z.string(),
      points: scanPointsSchema.optional(),
    }),
    z.object({
      qType: z.literal('pattern_scan'),
      prompt: z.array(blockSchema),
      targetMediaId: z.string(),
      targetUrl: z.string().optional(),
      points: scanPointsSchema.optional(),
    }),
    z.object({
      qType: z.literal('path_question'),
      prompt: z.array(blockSchema),
      cases: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          task: z.array(blockSchema),
          maxLen: z.number().int().positive().optional(),
          hidden: z.boolean().optional(),
        }),
      ).min(2),
      unlockAfterCases: z.number().int().positive(),
    }),
    z.object({
      qType: z.literal('matching'),
      prompt: z.array(blockSchema),
      items: z.array(matchItemSchema).min(1),
      targets: z.array(matchItemSchema).min(2),
      matches: z.array(z.object({ itemId: z.string(), targetId: z.string() })).optional(),
      targetCapacity: z.number().int().positive().optional(),
      shuffle: z.boolean().optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('number_range'),
      prompt: z.array(blockSchema),
      fields: z.array(numberRangeFieldSchema).min(1),
      labels: z.array(matchItemSchema).optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('swipe'),
      prompt: z.array(blockSchema),
      cards: z.array(swipeCardSchema).min(1),
      sideLabels: z.object({ left: z.string(), right: z.string() }).optional(),
      shuffle: z.boolean().optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('blurred_sentences'),
      prompt: z.array(blockSchema),
      sentences: z.array(blurredSentenceSchema).min(1),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('open_list'),
      prompt: z.array(blockSchema),
      fieldCount: z.number().int().positive(),
      fieldLabel: z.string().optional(),
      fields: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
      openEnded: z.boolean().optional(),
      maxLen: z.number().int().positive().optional(),
      scoring: itemScoringSchema.optional(),
    }),
    z.object({
      qType: z.literal('yes_no_reason'),
      prompt: z.array(blockSchema),
      choices: z.array(choiceSchema).min(2),
      reasonLabel: z.string().optional(),
      reasonMaxLen: z.number().int().positive().optional(),
      completionPoints: z.number().nonnegative().optional(),
    }),
  ]),
)

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.intersection(blockBodySchema, z.object({ onlyForOptions: optionIdsSchema.optional() })),
)

const blockBodySchema: z.ZodType<BlockBody> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), markdown: z.string() }),
    z.object({
      kind: z.literal('image'),
      mediaId: z.string(),
      url: z.string().optional(),
      title: z.string().optional(),
      caption: z.string().optional(),
      showOn: z.array(blockRoleSchema).optional(),
    }),
    z.object({
      kind: z.literal('video'),
      mediaId: z.string(),
      url: z.string().optional(),
      autoplay: z.boolean().optional(),
    }),
    z.object({ kind: z.literal('question'), question: questionSchema }),
    z.object({
      kind: z.literal('timer'),
      seconds: z.number().int().positive(),
      direction: z.enum(['up', 'down']),
    }),
    z.object({ kind: z.literal('heading'), text: z.string() }),
    z.object({ kind: z.literal('html'), html: z.string() }),
    z.object({
      kind: z.literal('button'),
      variant: z.enum(['copy', 'external-link']),
      label: z.string(),
      text: z.string().optional(),
      url: z.string().optional(),
      description: z.string().optional(),
    }),
  ]),
)
