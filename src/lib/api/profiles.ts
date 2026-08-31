import { getSupabase } from '../supabase';
import { profileSchema, type Profile } from '../schemas/profile';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, handle, display_name, avatar_path, home_metro, inspection_count, is_suspended, terms_accepted_at, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`getProfile: ${error.message}`);
  return data ? profileSchema.parse(data) : null;
}

/**
 * The terms acceptance gate. Apple has rejected apps for missing this alone
 * (docs/06-store-compliance.md) and the RLS insert policy on ratings enforces it, so
 * this is not merely a UI checkbox.
 */
export async function acceptTerms(userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('profiles')
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(`acceptTerms: ${error.message}`);
}

export async function updateProfile(
  userId: string,
  patch: { display_name?: string; home_metro?: string },
): Promise<void> {
  const { error } = await getSupabase().from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(`updateProfile: ${error.message}`);
}
