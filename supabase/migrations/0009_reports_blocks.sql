-- Report and block are compliance surfaces, not features. Both stores require them
-- for UGC, and retrofitting them into an existing feed is a rewrite
-- (docs/06-store-compliance.md).

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id   uuid not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  detail      text,
  status      text not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  -- SLA: within 24h of created_at. Apple asks about this; have an answer.
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint target_known check (target_type in ('rating','photo','profile')),
  constraint reason_known check (reason in ('spam','harassment','inaccurate','explicit','other')),
  constraint status_known check (status in ('open','actioned','dismissed'))
);

create trigger reports_touch before update on public.reports
  for each row execute function public.touch_updated_at();

create index reports_open on public.reports (created_at) where status = 'open';
create unique index reports_one_per_reporter on public.reports (reporter_id, target_type, target_id);

create table public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint no_self_block check (blocker_id <> blocked_id)
);

create trigger blocks_touch before update on public.blocks
  for each row execute function public.touch_updated_at();

create unique index blocks_unique on public.blocks (blocker_id, blocked_id);
create index blocks_blocked on public.blocks (blocked_id);
