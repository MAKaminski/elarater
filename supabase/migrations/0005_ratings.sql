create table public.ratings (
  id                uuid primary key default gen_random_uuid(),
  elevator_id       uuid not null references public.elevators (id) on delete cascade,
  author_id         uuid references public.profiles (id) on delete set null,

  -- Four taps, not a form. docs/01-product-spec.md.
  smooth            int not null,
  speedy            int not null,
  spotless          int not null,
  character         int not null,

  -- DERIVED. Trigger only, never the client. If a client sends one, reject the insert.
  score             numeric(2,1),
  band              text,

  remark_1          text,
  remark_2          text,

  -- UGC starts unpublished. Only 'approved' rows are publicly readable — this is the
  -- Apple 1.2 filtering requirement (docs/06-store-compliance.md).
  moderation_status text not null default 'pending',
  moderation_reason text,
  is_hidden         boolean not null default false,

  inspected_on      date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint subscores_in_range check (
    smooth between 1 and 5 and speedy between 1 and 5 and
    spotless between 1 and 5 and character between 1 and 5),

  -- A hard constraint, not a UI suggestion: 49 characters overruns the certificate
  -- field and breaks the layout (docs/03-erd.md).
  constraint remark_len check (
    coalesce(length(remark_1), 0) <= 48 and coalesce(length(remark_2), 0) <= 48),

  constraint moderation_known check (moderation_status in ('pending','approved','rejected')),
  constraint band_known check (band is null or band in
    ('EXCELLENT','SATISFACTORY','ACCEPTABLE','DEFICIENT','CONDEMNED'))
);

create trigger ratings_touch before update on public.ratings
  for each row execute function public.touch_updated_at();

-- One rating per user per elevator per day: stops score farming.
create unique index ratings_author_elevator_day
  on public.ratings (author_id, elevator_id, inspected_on);

create index ratings_elevator_created on public.ratings (elevator_id, created_at desc)
  where is_hidden = false;
create index ratings_author on public.ratings (author_id, created_at desc);
