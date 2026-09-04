/**
 * Photo upload and retrieval.
 *
 * Photos are one of the four things defending against an Apple 4.2 "just a form"
 * rejection (docs/06-store-compliance.md), alongside real GPS discovery, the generated
 * certificate, and the offline queue.
 */
import { getSupabase } from '../supabase';
import { captionSchema, photoSchema, type Photo } from '../schemas/photo';

const BUCKET = 'photos';

/** Bucket ceiling from migration 0014. Enforced here so the failure is legible. */
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export type UploadPhotoInput = {
  elevatorId: string;
  /** Local file URI from expo-image-picker. */
  uri: string;
  mimeType?: string;
  width?: number;
  height?: number;
  caption?: string;
  /** Attach to the rating it was taken for, when there is one. */
  ratingId?: string;
};

/**
 * Upload one photo and record it.
 *
 * Storage RLS keys objects by the uploader's id — `{userId}/{name}` — so the path is
 * not cosmetic: writing outside your own folder is refused by policy, not by this code.
 */
export async function uploadPhoto(input: UploadPhotoInput, userId: string): Promise<Photo> {
  const caption = captionSchema.parse(input.caption);
  const supabase = getSupabase();

  const response = await fetch(input.uri);
  const blob = await response.blob();

  const mime = input.mimeType ?? blob.type ?? 'image/jpeg';
  if (!ALLOWED.includes(mime)) {
    throw new Error('Photos must be JPEG, PNG or WebP.');
  }
  if (blob.size > MAX_BYTES) {
    throw new Error(`That photo is ${(blob.size / 1024 / 1024).toFixed(1)} MB. The limit is 8 MB.`);
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: mime, upsert: false });
  if (uploadError) throw new Error(`upload: ${uploadError.message}`);

  const { data, error } = await supabase
    .from('photos')
    .insert({
      elevator_id: input.elevatorId,
      rating_id: input.ratingId ?? null,
      uploader_id: userId,
      storage_path: path,
      width: input.width ?? null,
      height: input.height ?? null,
      caption: caption ?? null,
    })
    .select('id, storage_path, caption, width, height, uploader_id, created_at')
    .single();

  if (error) {
    // Do not leave an orphan object behind if the row fails to land.
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`photo record: ${error.message}`);
  }

  return photoSchema.parse(data);
}

export async function getElevatorPhotos(elevatorId: string, limit = 24): Promise<Photo[]> {
  const { data, error } = await getSupabase()
    .rpc('elevator_photos', { p_elevator_id: elevatorId, limit_n: limit });
  if (error) throw new Error(`elevator_photos: ${error.message}`);
  return photoSchema.array().parse(data ?? []);
}

/** The bucket is public-read, so a plain public URL is correct and cacheable. */
export function photoUrl(storagePath: string): string {
  return getSupabase().storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function deletePhoto(photo: Photo): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) throw new Error(`deletePhoto: ${error.message}`);
  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
}
