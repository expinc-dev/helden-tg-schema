import { z } from 'zod'

// Summary — the closing personal recap ("Ringkasan") a participant takes home.
//
// The phone lists the participant's own answers across the whole game and offers
// them as a downloadable PDF; the central screen shows two closing paragraphs.
// The runtime reads the answers itself, so none of the recap is authored here —
// only the copy around it. Every field is optional: an absent field falls back to
// the runtime's built-in Indonesian text.
//
// `closingLine` and `closingHighlight` render as ONE paragraph on the central
// screen, the highlight in the accent colour (Figma Closing 2b: "Kamu nggak butuh
// jadi ahli AI. <Kamu cuma butuh tetap jadi kamu sambil alatnya bantu.>").
export const summaryContentSchema = z.object({
  type: z.literal('summary'),
  // Phone — title and line under it.
  heading: z.string().optional(),
  subtitle: z.string().optional(),
  // Phone — the card that saves/shares the PDF.
  downloadLabel: z.string().optional(),
  downloadDescription: z.string().optional(),
  // Title printed at the top of the PDF.
  pdfTitle: z.string().optional(),
  // Central — first paragraph.
  instructions: z.string().optional(),
  // Central — second paragraph, plain part then accented part.
  closingLine: z.string().optional(),
  closingHighlight: z.string().optional(),
})
export type SummaryContent = z.infer<typeof summaryContentSchema>
