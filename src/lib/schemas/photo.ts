import { z } from 'zod';

export const photoSchema = z.object({
  id: z.uuid(),
  storage_path: z.string(),
  caption: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  uploader_id: z.uuid().nullable(),
  created_at: z.string(),
});

export type Photo = z.infer<typeof photoSchema>;

/** Same printable set the certificate can draw, and the same reasoning. */
export const captionSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^[\x20-\x7E·']*$/u, 'Captions can only use standard keyboard characters.')
  .optional()
  .or(z.literal('').transform(() => undefined));
