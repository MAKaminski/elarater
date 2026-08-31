/**
 * Report and block. Both stores require these in-app for UGC, reachable in two taps
 * from the content (docs/06-store-compliance.md).
 */
import { getSupabase } from '../supabase';
import { reportSchema, type ReportInput } from '../schemas/moderation';

export async function reportContent(input: ReportInput, reporterId: string) {
  const v = reportSchema.parse(input);
  const { error } = await getSupabase().from('reports').insert({
    target_type: v.targetType,
    target_id: v.targetId,
    reason: v.reason,
    detail: v.detail ?? null,
    reporter_id: reporterId,
  });
  if (error) {
    if (error.code === '23505') return; // already reported; treat as success
    throw new Error(`reportContent: ${error.message}`);
  }
}

/** Blocking is immediate and filters the feed through visible_ratings, both ways. */
export async function blockUser(blockedId: string, blockerId: string) {
  const { error } = await getSupabase().from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error && error.code !== '23505') throw new Error(`blockUser: ${error.message}`);
}

export async function unblockUser(blockedId: string, blockerId: string) {
  const { error } = await getSupabase()
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw new Error(`unblockUser: ${error.message}`);
}

export async function getBlockedUsers(blockerId: string) {
  const { data, error } = await getSupabase()
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', blockerId);
  if (error) throw new Error(`getBlockedUsers: ${error.message}`);
  return data ?? [];
}
