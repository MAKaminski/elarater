/**
 * Zod at every boundary. Every network response passes through a schema before it
 * touches a component (docs/02-architecture.md).
 */
import { z } from 'zod';
import { fieldLimits } from '@/theme/tokens';

const subScore = z.number().int().min(1).max(5);

/** Remarks are constrained in three places: here, the DB check, and the certificate. */
const remark = z
  .string()
  .trim()
  .max(fieldLimits.remark1, `Remarks are limited to ${fieldLimits.remark1} characters — ` +
    'a longer line overruns the certificate field.')
  // The certificate draws from a baked Latin-1 glyph table; anything outside it would
  // render as a blank advance. Rejecting it here is honest rather than silently lossy.
  .regex(/^[\x20-\x7E·’]*$/u, 'Remarks can only use standard keyboard characters.')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const bandSchema = z.enum([
  'EXCELLENT',
  'SATISFACTORY',
  'ACCEPTABLE',
  'DEFICIENT',
  'CONDEMNED',
]);

/** What the client is allowed to send. Note the absence of score, band and serial. */
export const createRatingSchema = z.object({
  elevatorId: z.uuid(),
  smooth: subScore,
  speedy: subScore,
  spotless: subScore,
  character: subScore,
  remark1: remark,
  remark2: remark,
  inspectedOn: z.iso.date().optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

/** What comes back from visible_ratings — the only ratings source a feed may read. */
export const visibleRatingSchema = z.object({
  id: z.uuid(),
  elevator_id: z.uuid(),
  author_id: z.uuid().nullable(),
  smooth: subScore,
  speedy: subScore,
  spotless: subScore,
  character: subScore,
  score: z.coerce.number().min(0).max(5),
  band: bandSchema,
  remark_1: z.string().nullable(),
  remark_2: z.string().nullable(),
  inspected_on: z.string(),
  created_at: z.string(),
  serial: z.string().nullable(),
  issued_at: z.string().nullable(),
  render_path: z.string().nullable(),
  elevator_label: z.string(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  capacity_lb: z.number().int().nullable(),
  floors_served: z.number().int().nullable(),
  building_id: z.uuid(),
  building_name: z.string(),
  address_line: z.string(),
  city: z.string(),
  metro_code: z.string(),
  author_handle: z.string().nullable(),
  author_display_name: z.string().nullable(),
});

export type VisibleRating = z.infer<typeof visibleRatingSchema>;
