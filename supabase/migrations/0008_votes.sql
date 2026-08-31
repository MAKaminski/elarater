create table public.votes (
  id         uuid primary key default gen_random_uuid(),
  rating_id  uuid not null references public.ratings (id) on delete cascade,
  voter_id   uuid not null references public.profiles (id) on delete cascade,
  -- +1 only in v1: "this is accurate". No downvotes, no leaderboards yet.
  value      int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint value_positive check (value = 1)
);

create trigger votes_touch before update on public.votes
  for each row execute function public.touch_updated_at();

create unique index votes_unique on public.votes (rating_id, voter_id);
