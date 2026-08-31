/**
 * Account deletion. Required in-app by both stores — not a support email, not a web
 * form (docs/06-store-compliance.md).
 */
import { getSupabase } from '../supabase';

export type DeleteAccountResult = { ok: true } | { ok: false; message: string };

/**
 * Calls the delete-account Edge Function, which runs with the service role: it soft
 * deletes the profile, anonymises the user's ratings so each elevator's score history
 * survives while authorship does not, and schedules the hard purge.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { ok: false, message: 'You are not signed in.' };

  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) return { ok: false, message: error.message };

  await supabase.auth.signOut();
  return { ok: true };
}
