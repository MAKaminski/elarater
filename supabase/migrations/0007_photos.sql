create table public.photos (
  id                uuid primary key default gen_random_uuid(),
  elevator_id       uuid not null references public.elevators (id) on delete cascade,
  rating_id         uuid references public.ratings (id) on delete set null,
  uploader_id       uuid references public.profiles (id) on delete set null,
  storage_path      text not null,
  width             int,
  height            int,
  moderation_status text not null default 'pending',
  is_hidden         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint moderation_known check (moderation_status in ('pending','approved','rejected'))
);

create trigger photos_touch before update on public.photos
  for each row execute function public.touch_updated_at();

create index photos_elevator on public.photos (elevator_id, created_at desc)
  where is_hidden = false;
