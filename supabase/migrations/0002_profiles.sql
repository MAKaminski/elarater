create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  handle            citext unique not null,
  display_name      text,
  avatar_path       text,
  -- Drives the certificate serial prefix: ATL-004572.
  home_metro        text not null default 'ATL',
  -- Denormalised, trigger-maintained. "47 elevators inspected" on the profile.
  inspection_count  int not null default 0,
  is_suspended      boolean not null default false,
  -- Terms acceptance gate. Apple has rejected apps for missing this alone
  -- (docs/06-store-compliance.md).
  terms_accepted_at timestamptz,
  -- Soft delete; hard purge after 30 days.
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint handle_shape check (handle ~ '^[a-z0-9_]{3,20}$'),
  constraint metro_shape  check (home_metro ~ '^[A-Z]{2,4}$')
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create index profiles_visible on public.profiles (id)
  where deleted_at is null and is_suspended = false;

-- A profile row per auth user, created on signup so nothing downstream has to cope
-- with a missing one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate text;
begin
  candidate := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if length(candidate) < 3 then
    candidate := 'inspector';
  end if;
  candidate := left(candidate, 14) || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, handle, display_name)
  values (new.id, candidate, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
