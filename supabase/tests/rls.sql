/**
 * RLS policy tests. docs/07-scaffold-plan.md, Phase 3 acceptance:
 * "a user cannot read another's hidden rating, cannot write a derived column,
 *  cannot see a blocked author".
 *
 * RLS gaps are silent, so every assertion here is a negative. Run with:
 *   npm run test:rls
 */
\set ON_ERROR_STOP on
\set QUIET on

create or replace function pg_temp.as_user(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;

create or replace function pg_temp.as_anon() returns void
language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function pg_temp.ok(p_cond boolean, p_what text) returns void
language plpgsql as $$
begin
  if p_cond then
    raise notice 'ok   %', p_what;
  else
    raise exception 'FAIL %', p_what;
  end if;
end;
$$;

\echo '--- RLS ---'

-- Fixtures: a pending rating by user A, and a mutual block between A and B.
set role postgres;
insert into public.ratings (id, elevator_id, author_id, smooth, speedy, spotless, character,
                            remark_1, moderation_status, inspected_on)
values ('cccccccc-0000-4000-8000-00000000000f',
        'bbbbbbbb-0000-4000-8000-000000000003',
        '11111111-1111-4111-8111-111111111111',
        3, 3, 3, 3, 'Awaiting moderation.', 'pending', date '2026-08-28')
on conflict (id) do nothing;

insert into public.blocks (blocker_id, blocked_id)
values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

-- 1. A user cannot read another user's unapproved rating -----------------------
begin;
  select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
  select pg_temp.ok(
    (select count(*) from public.ratings where id = 'cccccccc-0000-4000-8000-00000000000f') = 0,
    'another user cannot read a pending rating');
rollback;

begin;
  select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
  select pg_temp.ok(
    (select count(*) from public.ratings where id = 'cccccccc-0000-4000-8000-00000000000f') = 1,
    'the author CAN read their own pending rating');
rollback;

begin;
  select pg_temp.as_anon();
  select pg_temp.ok(
    (select count(*) from public.ratings where moderation_status <> 'approved') = 0,
    'anonymous readers see no unapproved ratings');
rollback;

-- 2. A user cannot write a derived column --------------------------------------
begin;
  select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
  do $$
  begin
    insert into public.ratings (elevator_id, author_id, smooth, speedy, spotless, character, score, band)
    values ('bbbbbbbb-0000-4000-8000-000000000003',
            '11111111-1111-4111-8111-111111111111', 1, 1, 1, 1, 5.0, 'EXCELLENT');
    raise exception 'FAIL a client wrote ratings.score directly';
  exception
    when check_violation then raise notice 'ok   client cannot write ratings.score / band';
  end;
  $$;
rollback;

begin;
  select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
  do $$
  declare v_score numeric;
  begin
    insert into public.ratings (elevator_id, author_id, smooth, speedy, spotless, character, inspected_on)
    values ('bbbbbbbb-0000-4000-8000-000000000003',
            '11111111-1111-4111-8111-111111111111', 1, 2, 1, 1, date '2026-08-20')
    returning score into v_score;
    -- 5/4 = 1.25 -> x2 = 2.5 -> round 3 -> /2 = 1.5. DEFICIENT, not CONDEMNED.
    if v_score <> 1.5 then
      raise exception 'FAIL score rounding: expected 1.5, got %', v_score;
    end if;
    raise notice 'ok   score rounds half-away-from-zero at the CONDEMNED boundary (1.5)';
  end;
  $$;
rollback;

begin;
  select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
  do $$
  begin
    insert into public.certificates (rating_id, serial, metro_code, sequence)
    values ('cccccccc-0000-4000-8000-00000000000f', 'ATL-999999', 'ATL', 999999);
    raise exception 'FAIL a client minted a certificate serial';
  exception
    when insufficient_privilege then raise notice 'ok   client cannot mint a certificate serial';
  end;
  $$;
rollback;

-- 3. A user cannot see a blocked author ----------------------------------------
begin;
  select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
  select pg_temp.ok(
    (select count(*) from public.visible_ratings
      where author_id = '11111111-1111-4111-8111-111111111111') = 0,
    'blocker sees none of the blocked author''s ratings');
  select pg_temp.ok(
    (select count(*) from public.visible_ratings) > 0,
    'blocker still sees everyone else');
rollback;

begin;
  -- The block is one-directional in the table but must filter BOTH ways.
  select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
  select pg_temp.ok(
    (select count(*) from public.visible_ratings
      where author_id = '22222222-2222-4222-8222-222222222222') = 0,
    'the blocked user also stops seeing the blocker');
rollback;

-- 4. Terms gate -----------------------------------------------------------------
begin;
  set role postgres;
  update public.profiles set terms_accepted_at = null
   where id = '22222222-2222-4222-8222-222222222222';
  select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
  do $$
  begin
    insert into public.ratings (elevator_id, author_id, smooth, speedy, spotless, character)
    values ('bbbbbbbb-0000-4000-8000-000000000003',
            '22222222-2222-4222-8222-222222222222', 4, 4, 4, 4);
    raise exception 'FAIL a user posted before accepting terms';
  exception
    when insufficient_privilege then raise notice 'ok   terms gate blocks a first post';
  end;
  $$;
rollback;

-- 5. Cross-author writes ---------------------------------------------------------
begin;
  select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
  do $$
  begin
    insert into public.ratings (elevator_id, author_id, smooth, speedy, spotless, character)
    values ('bbbbbbbb-0000-4000-8000-000000000003',
            '11111111-1111-4111-8111-111111111111', 5, 5, 5, 5);
    raise exception 'FAIL a user wrote a rating as somebody else';
  exception
    when insufficient_privilege then raise notice 'ok   a user cannot author as somebody else';
  end;
  $$;
rollback;

\echo '--- all RLS assertions passed ---'
