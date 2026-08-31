/**
 * Remark classification. Pure, dependency-free, and shared by two runtimes:
 *
 *   supabase/functions/moderate-remarks  Deno, runs with the service role
 *   src/lib/moderation/classify.test.ts  vitest, runs in CI
 *
 * Apple 1.2 / Play UGC require that objectionable content be filtered before it is
 * publicly visible. Ratings land as 'pending' and only 'approved' rows are publicly
 * readable, so that ordering — not this classifier's cleverness — is the compliance
 * property. The classifier can improve without changing it.
 *
 * The bias is deliberate: anything uncertain is escalated to a human rather than
 * published or silently dropped.
 */

const BLOCKED = [
  // Slurs and sexual content, with common character substitutions. Kept explicit
  // rather than clever: a false positive costs one human review, a false negative
  // costs an app rejection.
  '\\bc[u*]nt\\b',
  '\\bn[i1]gg[e3]r',
  '\\bf[a4]gg?[o0]t',
  '\\bk[i1]k[e3]\\b',
  '\\bsp[i1]c\\b',
  '\\btr[a4]nn[yi]\\b',
  '\\br[e3]t[a4]rd',
  '\\bwh[o0]r[e3]\\b',
  '\\bp[o0]rn',
  '\\br[a4]p[e3]\\b',
  '\\bp[e3]d[o0]',
];

const SPAM = [
  '\\bhttps?://',                       // no links
  '\\b[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}',  // no email addresses
  '\\b\\+?\\d[\\d\\s().-]{7,}\\d\\b',   // no phone numbers
  '\\b(?:bitcoin|crypto|forex|onlyfans|telegram|whatsapp)\\b',
];

/** The certificate draws from a baked Latin-1 glyph table; nothing else can render. */
const RENDERABLE = /^[\x20-\x7E·’]*$/;

export type ModerationStatus = 'approved' | 'rejected' | 'pending';

export type Verdict = {
  status: ModerationStatus;
  /** Stored in ratings.moderation_reason so a human can see why. */
  reason: string | null;
};

export function classify(remarks: (string | null | undefined)[]): Verdict {
  const text = remarks.filter(Boolean).join(' ');
  if (!text.trim()) return { status: 'approved', reason: null };

  if (!RENDERABLE.test(text)) {
    return { status: 'rejected', reason: 'unsupported_characters' };
  }
  for (const p of BLOCKED) {
    if (new RegExp(p, 'i').test(text)) return { status: 'rejected', reason: 'objectionable' };
  }
  for (const p of SPAM) {
    if (new RegExp(p, 'i').test(text)) return { status: 'rejected', reason: 'spam_or_contact' };
  }

  // Shouting is not a violation, but it is a decent signal for a human to look.
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length > 12 && letters === letters.toUpperCase()) {
    return { status: 'pending', reason: 'all_caps_review' };
  }

  return { status: 'approved', reason: null };
}
