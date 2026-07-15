import { z } from 'zod'
import { phaseSchema } from './phase.js'

// Game-level flow. Per-phase syncMode + teamMode already exist; flowMode says
// how the host progresses BETWEEN phases:
//   sequence = linear next through phaseOrder (existing behaviour).
//   modular  = level picker; host jumps to any phase, returns to picker between
//              phases; picker resting state is represented by phasePointer
//              pointing at phaseOrder[0], which must be an idle phase.
// Default 'sequence' keeps pre-2.1 published bundles working unchanged.
export const flowModeSchema = z.enum(['sequence', 'modular'])
export type FlowMode = z.infer<typeof flowModeSchema>

// Firestore Timestamp is not portable into this pure library. Use a Zod branding
// approach: any object with .toDate() OR an ISO string OR a number. Consumers
// (tg-cms/tg-runtime) can refine on their side.
const timestampSchema = z.union([
  z.string(), // ISO
  z.number(), // ms since epoch
  z.object({ seconds: z.number(), nanoseconds: z.number() }).passthrough(), // Firestore Timestamp shape
])
export type SchemaTimestamp = z.infer<typeof timestampSchema>

// GameDraft — mutable authoring doc (Firestore /games/{gameId}).
export const gameDraftSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  schemaVersion: z.string(),
  phaseOrder: z.array(z.string()),
  flowMode: flowModeSchema.default('sequence'),
  defaults: z.object({
    maxPlayers: z.number().int().positive(),
    maxCentralScreens: z.number().int().positive(),
  }),
  updatedAt: timestampSchema,
  latestPublishedVersionId: z.string().optional(),
})
export type GameDraft = z.infer<typeof gameDraftSchema>

// PublishedGame — immutable compiled bundle (Firestore /publishedGames/{gameVersionId}).
// Fully resolved, no lazy refs. Runtime loads exactly this.
export const publishedGameSchema = z.object({
  id: z.string(), // gameVersionId
  gameId: z.string(),
  schemaVersion: z.string(),
  title: z.string(),
  phaseOrder: z.array(z.string()),
  flowMode: flowModeSchema.default('sequence'),
  phases: z.record(z.string(), phaseSchema),
  publishedAt: timestampSchema,
  publishedBy: z.string(),
})
export type PublishedGame = z.infer<typeof publishedGameSchema>
