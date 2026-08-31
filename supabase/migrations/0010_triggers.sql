-- Derived values. The client never writes any of these; if a client sends one, the
-- insert is rejected (docs/03-erd.md, "Derived-value rules").

/**
 * Score -> band. Mirrors certificate.bands in brand/tokens/design-tokens.json and
 * src/lib/certificate/bands.ts. If the token file changes, both change together.
 */
create or replace function public.band_for_score(p_score numeric)
returns text
language sql
immutable
as $$
  select case
    when p_score >= 4.5 then 'EXCELLENT'
    when p_score >= 3.5 then 'SATISFACTORY'
    when p_score >= 2.5 then 'ACCEPTABLE'
    when p_score >= 1.5 then 'DEFICIENT'
    else 'CONDEMNED'
  end;
$$;

/**
 * round(mean(smooth, speedy, spotless, character) * 2) / 2 -> one decimal, half steps.
 *
 * Postgres round() is half-away-from-zero, and so is JavaScript's Math.round for
 * positive values, so an optimistic client score always matches what lands here:
 *   1,2,1,1 -> 1.25 -> x2 = 2.5 -> round 3 -> /2 = 1.5 -> DEFICIENT, not CONDEMNED.
 */
create or replace function public.compute_rating_score(
  p_smooth int, p_speedy int, p_spotless int, p_character int)
returns numeric
language sql
immutable
as $$
  select round((p_smooth + p_speedy + p_spotless + p_character) / 4.0 * 2) / 2;
$$;

/** Refuse any client-supplied derived column, then compute the real values. */
create or replace function public.ratings_derive()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and (new.score is not null or new.band is not null) then
    raise exception 'ratings.score and ratings.band are derived; do not write them'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE'
     and (new.score is distinct from old.score or new.band is distinct from old.band)
     and new.smooth = old.smooth and new.speedy = old.speedy
     and new.spotless = old.spotless and new.character = old.character then
    raise exception 'ratings.score and ratings.band are derived; do not write them'
      using errcode = 'check_violation';
  end if;

  new.score := public.compute_rating_score(new.smooth, new.speedy, new.spotless, new.character);
  new.band  := public.band_for_score(new.score);
  return new;
end;
$$;

create trigger ratings_before_write
  before insert or update on public.ratings
  for each row execute function public.ratings_derive();

/**
 * After a rating lands: issue its certificate, then recompute the elevator's rolling
 * score and the author's inspection count.
 */
create or replace function public.ratings_after_insert()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_metro text;
  v_serial text;
begin
  select b.metro_code into v_metro
    from public.elevators e
    join public.buildings b on b.id = e.building_id
   where e.id = new.elevator_id;

  v_serial := public.next_serial(coalesce(v_metro, 'ATL'));

  insert into public.certificates (rating_id, serial, metro_code, sequence)
  values (
    new.id,
    v_serial,
    split_part(v_serial, '-', 1),
    split_part(v_serial, '-', 2)::int
  );

  return null;
end;
$$;

create trigger ratings_issue_certificate
  after insert on public.ratings
  for each row execute function public.ratings_after_insert();

/** elevators.score_avg is the mean of VISIBLE, APPROVED ratings only. */
create or replace function public.sync_elevator_score()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_elevator uuid := coalesce(new.elevator_id, old.elevator_id);
  v_avg numeric;
  v_count int;
begin
  select round(avg(score) * 2) / 2, count(*)
    into v_avg, v_count
    from public.ratings
   where elevator_id = v_elevator
     and is_hidden = false
     and moderation_status = 'approved';

  update public.elevators
     set score_avg = v_avg,
         rating_count = coalesce(v_count, 0),
         current_band = case when v_avg is null then null else public.band_for_score(v_avg) end
   where id = v_elevator;

  return null;
end;
$$;

create trigger ratings_sync_elevator
  after insert or update or delete on public.ratings
  for each row execute function public.sync_elevator_score();

/** profiles.inspection_count — "47 elevators inspected". */
create or replace function public.sync_inspection_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_author uuid := coalesce(new.author_id, old.author_id);
begin
  if v_author is null then return null; end if;

  update public.profiles
     set inspection_count = (
       select count(*) from public.ratings
        where author_id = v_author and is_hidden = false)
   where id = v_author;

  return null;
end;
$$;

create trigger ratings_sync_inspection_count
  after insert or update or delete on public.ratings
  for each row execute function public.sync_inspection_count();
