-- RLS on every table from day one, including during development (CLAUDE.md).
alter table public.profiles        enable row level security;
alter table public.buildings       enable row level security;
alter table public.elevators       enable row level security;
alter table public.ratings         enable row level security;
alter table public.certificates    enable row level security;
alter table public.photos          enable row level security;
alter table public.votes           enable row level security;
alter table public.reports         enable row level security;
alter table public.blocks          enable row level security;
alter table public.metro_sequences enable row level security;

/** True when the viewer and the target have blocked each other in either direction. */
create or replace function public.is_blocked(p_other uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.blocks
     where (blocker_id = auth.uid() and blocked_id = p_other)
        or (blocked_id = auth.uid() and blocker_id = p_other)
  );
$$;

-- profiles -------------------------------------------------------------------
create policy profiles_read_public on public.profiles for select
  using (deleted_at is null and is_suspended = false and not public.is_blocked(id));
create policy profiles_read_own on public.profiles for select
  using (id = auth.uid());
create policy profiles_write_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- buildings ------------------------------------------------------------------
create policy buildings_read on public.buildings for select using (true);
create policy buildings_insert on public.buildings for insert to authenticated
  with check (created_by = auth.uid());
create policy buildings_update_creator on public.buildings for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- elevators ------------------------------------------------------------------
create policy elevators_read on public.elevators for select using (true);
create policy elevators_insert on public.elevators for insert to authenticated
  with check (created_by = auth.uid());
create policy elevators_update_creator on public.elevators for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- ratings --------------------------------------------------------------------
-- Public reads see approved, unhidden rows from authors neither party has blocked.
create policy ratings_read_public on public.ratings for select
  using (is_hidden = false and moderation_status = 'approved'
         and (author_id is null or not public.is_blocked(author_id)));
-- Authors always see their own, including pending and rejected ones.
create policy ratings_read_own on public.ratings for select
  using (author_id = auth.uid());
create policy ratings_insert_own on public.ratings for insert to authenticated
  with check (
    author_id = auth.uid()
    -- Terms acceptance gate before a user's first post.
    and exists (select 1 from public.profiles p
                 where p.id = auth.uid()
                   and p.terms_accepted_at is not null
                   and p.is_suspended = false
                   and p.deleted_at is null)
  );
-- A 15-minute correction window, then the record stands.
create policy ratings_update_own on public.ratings for update to authenticated
  using (author_id = auth.uid() and created_at > now() - interval '15 minutes')
  with check (author_id = auth.uid());
create policy ratings_delete_own on public.ratings for delete to authenticated
  using (author_id = auth.uid());

-- certificates ---------------------------------------------------------------
-- Readable when the parent rating is; never writable — the trigger owns this table.
create policy certificates_read on public.certificates for select
  using (exists (select 1 from public.ratings r where r.id = rating_id));

-- photos ---------------------------------------------------------------------
create policy photos_read on public.photos for select
  using (is_hidden = false and moderation_status = 'approved');
create policy photos_read_own on public.photos for select using (uploader_id = auth.uid());
create policy photos_insert_own on public.photos for insert to authenticated
  with check (uploader_id = auth.uid());
create policy photos_delete_own on public.photos for delete to authenticated
  using (uploader_id = auth.uid());

-- votes ----------------------------------------------------------------------
create policy votes_read on public.votes for select using (true);
create policy votes_insert_own on public.votes for insert to authenticated
  with check (voter_id = auth.uid());
create policy votes_delete_own on public.votes for delete to authenticated
  using (voter_id = auth.uid());

-- reports --------------------------------------------------------------------
-- Reporters see only their own reports. Moderation reads with the service role.
create policy reports_read_own on public.reports for select using (reporter_id = auth.uid());
create policy reports_insert_own on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- blocks ---------------------------------------------------------------------
create policy blocks_read_own on public.blocks for select using (blocker_id = auth.uid());
create policy blocks_insert_own on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());
create policy blocks_delete_own on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- metro_sequences ------------------------------------------------------------
-- No policies at all: serial allocation is reachable only through next_serial(),
-- which is security definer.

grant execute on function public.search_nearby_elevators(double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.certificate_by_serial(text) to anon, authenticated;
grant execute on function public.is_blocked(uuid) to anon, authenticated;

-- Privileges. RLS narrows what a role can see; it does not grant access in the first
-- place. Being explicit here beats relying on default privileges, and the absence of
-- a grant is itself a policy: certificates are read-only to clients, and
-- metro_sequences is unreachable except through next_serial().
grant usage on schema public to anon, authenticated;

grant select on
  public.profiles, public.buildings, public.elevators, public.ratings,
  public.certificates, public.photos, public.votes, public.visible_ratings
to anon, authenticated;

grant insert, update on public.buildings, public.elevators to authenticated;
grant insert, update, delete on public.ratings to authenticated;
grant insert, delete on public.photos, public.votes, public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant select on public.blocks to authenticated;
grant update on public.profiles to authenticated;

-- Deliberately NOT granted: insert/update/delete on certificates (trigger-owned) and
-- anything at all on metro_sequences.
