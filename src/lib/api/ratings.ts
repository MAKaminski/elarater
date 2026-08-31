import { getSupabase } from '../supabase';
import { createRatingSchema, visibleRatingSchema, type CreateRatingInput, type VisibleRating } from '../schemas/rating';

/**
 * Create a rating. The client sends four sub-scores and up to two remark lines and
 * nothing else — score, band and the certificate serial are all assigned by triggers
 * (docs/03-erd.md, "Derived-value rules").
 */
export async function createRating(input: CreateRatingInput, userId: string) {
  const v = createRatingSchema.parse(input);

  const { data, error } = await getSupabase()
    .from('ratings')
    .insert({
      elevator_id: v.elevatorId,
      author_id: userId,
      smooth: v.smooth,
      speedy: v.speedy,
      spotless: v.spotless,
      character: v.character,
      remark_1: v.remark1 ?? null,
      remark_2: v.remark2 ?? null,
      ...(v.inspectedOn ? { inspected_on: v.inspectedOn } : {}),
    })
    .select('id')
    .single();

  if (error) {
    // One rating per user per elevator per day: stops score farming.
    if (error.code === '23505') {
      throw new Error('You have already inspected this elevator today.');
    }
    throw new Error(`createRating: ${error.message}`);
  }
  return data.id;
}

/** The certificate for a rating, once moderation has cleared it. */
export async function getRatingCertificate(ratingId: string): Promise<VisibleRating | null> {
  const { data, error } = await getSupabase()
    .from('visible_ratings')
    .select('*')
    .eq('id', ratingId)
    .maybeSingle();
  if (error) throw new Error(`getRatingCertificate: ${error.message}`);
  return data ? visibleRatingSchema.parse(data) : null;
}

export async function getMyRatings(userId: string): Promise<VisibleRating[]> {
  const { data, error } = await getSupabase()
    .from('visible_ratings')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(`getMyRatings: ${error.message}`);
  return visibleRatingSchema.array().parse(data ?? []);
}
