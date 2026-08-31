-- Per-metro monotonic sequences. A plain Postgres sequence would need dynamic DDL for
-- every new metro, so allocation goes through this table instead; the row lock in
-- next_serial() serialises it.
create table public.metro_sequences (
  metro_code text primary key,
  last_value bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint metro_shape check (metro_code ~ '^[A-Z]{2,4}$')
);

create trigger metro_sequences_touch before update on public.metro_sequences
  for each row execute function public.touch_updated_at();

create table public.certificates (
  id          uuid primary key default gen_random_uuid(),
  rating_id   uuid not null unique references public.ratings (id) on delete cascade,
  serial      text not null unique,
  metro_code  text not null,
  sequence    int not null,
  -- Storage key for the rendered PNG. Null until render-certificate has run.
  render_path text,
  share_count int not null default 0,
  view_count  int not null default 0,
  issued_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint serial_shape check (serial ~ '^[A-Z]{2,4}-[0-9]{6}$')
);

create trigger certificates_touch before update on public.certificates
  for each row execute function public.touch_updated_at();

create index certificates_rating on public.certificates (rating_id);

/**
 * Allocate the next serial for a metro: {METRO}-{6 digits}, e.g. ATL-004572.
 * SERVER-SIDE ONLY. Never generated on the client (CLAUDE.md, "Data rules").
 */
create or replace function public.next_serial(p_metro text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  n bigint;
begin
  insert into public.metro_sequences (metro_code, last_value)
  values (p_metro, 1)
  on conflict (metro_code)
    do update set last_value = public.metro_sequences.last_value + 1, updated_at = now()
  returning last_value into n;

  return p_metro || '-' || lpad(n::text, 6, '0');
end;
$$;
