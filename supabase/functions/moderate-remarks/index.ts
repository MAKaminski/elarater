/**
 * moderate-remarks — Apple 1.2 / Play UGC filtering.
 *
 * Ratings land with moderation_status = 'pending' and only 'approved' rows are
 * publicly readable, so nothing a user writes is visible until this has run. That
 * ordering is the compliance property; the classifier itself can improve later
 * without changing it (docs/06-store-compliance.md).
 *
 * The classifier itself lives in src/lib/moderation/classify.ts so it is unit-tested
 * in CI rather than only reachable through a deployed function.
 *
 * Invoke on a schedule or from a DB webhook on ratings insert.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { classify } from '../../../src/lib/moderation/classify.ts';

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
    const verdict = classify([row.remark_1, row.remark_2]);
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
