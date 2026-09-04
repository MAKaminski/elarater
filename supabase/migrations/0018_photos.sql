-- Photo uploads.
--
-- The table, RLS and storage bucket have existed since 0007/0014 with no UI. This
-- adds what the upload path actually needs and settles the moderation posture.
--
-- MODERATION: remarks are screened before they are publicly readable, because
-- classifying text is cheap and deterministic. Images are not — doing it properly
-- needs a vision provider, which is a separate decision with a bill attached. So
-- photos are approved on upload and moderated reactively: report in two taps, hide
-- immediately, 24h SLA. That is the standard posture and it is honest, but it IS a
-- gap against docs/06's "filter objectionable content" and must be closed with a
-- classifier before store submission. Tracked in ARCHITECTURE.md.
alter table public.photos
  add column if not exists caption text,
  add column if not exists blurhash text;

alter table public.photos
  drop constraint if exists caption_len;
alter table public.photos
  add constraint caption_len check (coalesce(length(caption), 0) <= 120);

alter table public.photos alter column moderation_status set default 'approved';

comment on column public.photos.moderation_status is
  'Defaults to approved: image classification needs a vision provider we have not chosen. Moderation is reactive (report -> hide) until one is wired.';

-- Uploads are keyed by the elevator so a building page can show every photo of a car
-- without walking ratings.
create index if not exists photos_elevator_visible
  on public.photos (elevator_id, created_at desc)
  where is_hidden = false and moderation_status = 'approved';

/**
 * Photos for an elevator, block-filtered the same way ratings are. Hiding a person's
 * ratings while leaving their photographs up would defeat the point of a block.
 */
create or replace function public.elevator_photos(p_elevator_id uuid, limit_n int default 24)
returns table (
  id            uuid,
  storage_path  text,
  caption       text,
  width         int,
  height        int,
  uploader_id   uuid,
  created_at    timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.storage_path, p.caption, p.width, p.height, p.uploader_id, p.created_at
    from public.photos p
   where p.elevator_id = p_elevator_id
     and p.is_hidden = false
     and p.moderation_status = 'approved'
     and (p.uploader_id is null or not public.is_blocked(p.uploader_id))
   order by p.created_at desc
   limit least(greatest(limit_n, 1), 50);
$$;

grant execute on function public.elevator_photos(uuid, int) to anon, authenticated;
