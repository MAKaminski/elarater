/**
 * moderate-remarks — Apple 1.2 / Play UGC filtering.
 *
 * Ratings land with moderation_status = 'pending' and only 'approved' rows are
 * publicly readable, so nothing a user writes is visible until this has run. That
 * ordering is the compliance property; the classifier itself can improve later
 * without changing it (docs/06-store-compliance.md).
 *
 * v1 is deterministic: a slur and sexual-content list, contact-detail and spam-link
 * patterns, and a character-set check matching what the certificate can actually
 * draw. Anything it is unsure about is escalated to a human via the reports queue
 * rather than being published or silently dropped.
 *
 * Invoke on a schedule or from a DB webhook on ratings insert.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BLOCKED = [
  // Slurs and sexual content, matched on word boundaries. Kept short and explicit
  // rather than clever: a false positive here costs one review, a false negative
  // costs an app rejection.
  '\\bc[u*]nt\\b', '\\bn[i1]gg[e3]r', '\\bf[a4]gg?[o0]t', '\\bk[i1]k[e3]\\b',
  '\\bsp[i1]c\\b', '\\btr[a4]nn[yi]\\b', '\\br[e3]t[a4]rd', '\\bwh[o0]r[e3]\\b',
  '\\bp[o0]rn', '\\br[a4]p[e3]\\b', '\\bp[e3]d[o0]',
];

const SPAM = [
  '\\bhttps?://',            // no links in remarks
  '\\b\\w+@\\w+\\.\\w{2,}',  // no email addresses
  '\\b\\+?\\d[\\d\\s().-]{7,}\\d\\b', // no phone numbers
  '\\b(?:bitcoin|crypto|forex|onlyfans|telegram|whatsapp)\\b',
];

/** The certificate draws from a baked Latin-1 glyph table. */
const RENDERABLE = /^[\x20-\x7E·’]*$/;

type Verdict = { status: 'approved' | 'rejected' | 'pending'; reason: string | null };

export function classify(remarks: string[]): Verdict {
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

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Accept a single row from a DB webhook, or sweep the pending queue.
  let ids: string[] | null = null;
  try {
    const body = await req.json();
    if (body?.record?.id) ids = [body.record.id];
    else if (Array.isArray(body?.ids)) ids = body.ids;
  } catch {
    // no body — sweep mode
  }

  const query = admin
    .from('ratings')
    .select('id, remark_1, remark_2')
    .eq('moderation_status', 'pending')
    .limit(200);
  if (ids) query.in('id', ids);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results: Record<string, number> = { approved: 0, rejected: 0, pending: 0 };

  for (const row of data ?? []) {
    const verdict = classify([row.remark_1 ?? '', row.remark_2 ?? '']);
    results[verdict.status] += 1;
    if (verdict.status === 'pending') continue; // leave for a human

    await admin
      .from('ratings')
      .update({
        moderation_status: verdict.status,
        moderation_reason: verdict.reason,
        is_hidden: verdict.status === 'rejected',
      })
      .eq('id', row.id);
  }

  return Response.json({ reviewed: data?.length ?? 0, ...results });
});
