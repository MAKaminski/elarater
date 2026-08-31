import { z } from 'zod';

export const profileSchema = z.object({
  id: z.uuid(),
  handle: z.string(),
  display_name: z.string().nullable(),
  avatar_path: z.string().nullable(),
  home_metro: z.string(),
  inspection_count: z.number().int(),
  is_suspended: z.boolean(),
  terms_accepted_at: z.string().nullable(),
  created_at: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;
