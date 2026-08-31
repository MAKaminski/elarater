import { z } from 'zod';

/** Report and block are compliance surfaces (docs/06-store-compliance.md). */
export const reportSchema = z.object({
  targetType: z.enum(['rating', 'photo', 'profile']),
  targetId: z.uuid(),
  reason: z.enum(['spam', 'harassment', 'inaccurate', 'explicit', 'other']),
  detail: z.string().trim().max(500).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'inaccurate', label: 'Inaccurate inspection' },
  { value: 'explicit', label: 'Sexually explicit' },
  { value: 'other', label: 'Something else' },
] as const;
