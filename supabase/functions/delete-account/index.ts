/**
 * delete-account — required in-app by both stores.
 *
 * "Anonymise ratings rather than deleting them (the elevator's score history
 * survives, authorship does not)." (docs/06-store-compliance.md)
 *
 * Soft delete now, hard purge after 30 days. Runs with the service role, so the
 * caller's JWT is verified first and only ever deletes the caller's own account.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const url = Deno.env.get('SUPABASE_URL')!;

  // Verify the caller with their own token — never trust an id from the body.
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ error: 'Not signed in' }, { status: 401 });
  }
  const userId = userData.user.id;

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 1. Authorship goes. The inspection record stays, so every elevator's score
  //    history is unaffected by someone leaving.
  const { error: anonError } = await admin
    .from('ratings')
    .update({ author_id: null })
    .eq('author_id', userId);
  if (anonError) return Response.json({ error: anonError.message }, { status: 500 });

  await admin.from('photos').update({ uploader_id: null }).eq('uploader_id', userId);
  await admin.from('votes').delete().eq('voter_id', userId);
  await admin.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  // 2. Soft delete the profile and scrub its personal fields immediately.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      display_name: null,
      avatar_path: null,
      handle: `deleted_${userId.replace(/-/g, '').slice(0, 12)}`,
    })
    .eq('id', userId);
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  // 3. Revoke sessions immediately; the auth row is purged with the profile at 30 days.
  await admin.auth.admin.signOut(userId, 'global');

  return Response.json({
    ok: true,
    deleted_at: new Date().toISOString(),
    purge_after_days: 30,
  });
});
