-- Demo data. Real Atlanta addresses so nearby discovery can be exercised on a
-- simulator with a spoofed location. No placeholder or lorem content — the review
-- build must not contain any (docs/06-store-compliance.md).

-- Two demo inspectors. auth.users rows are inserted directly so the seed does not
-- depend on the auth API being reachable.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'demo@elarater.app',
   crypt('inspector-demo-2026', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'second@elarater.app',
   crypt('inspector-demo-2026', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}')
on conflict (id) do nothing;

update public.profiles
   set handle = 'demo_inspector', display_name = 'Demo Inspector',
       home_metro = 'ATL', terms_accepted_at = now()
 where id = '11111111-1111-4111-8111-111111111111';

update public.profiles
   set handle = 'second_opinion', display_name = 'Second Opinion',
       home_metro = 'ATL', terms_accepted_at = now()
 where id = '22222222-2222-4222-8222-222222222222';

insert into public.buildings (id, name, address_line, city, region, country, postal_code,
                              location, metro_code, created_by)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Promenade Tower', '1230 Peachtree St NE',
   'Atlanta', 'GA', 'US', '30309',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-84.3838, 33.7899), 4326)::extensions.geography,
   'ATL', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Bank of America Plaza', '600 Peachtree St NE',
   'Atlanta', 'GA', 'US', '30308',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-84.3860, 33.7714), 4326)::extensions.geography,
   'ATL', '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

insert into public.elevators (id, building_id, label, manufacturer, model, capacity_lb,
                              floors_served, install_year, created_by)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'North Bank Car 2', 'Otis', 'Gen2', 2500, 14, '2004',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Service Car', 'Dover', 'Freight', 4000, 11, '1988',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000002',
   'Sky Lobby Express', 'Kone', 'MonoSpace', 3000, 55, '2011',
   '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

-- Ratings. The trigger derives score and band and issues each certificate, so nothing
-- here writes a serial.
insert into public.ratings (elevator_id, author_id, smooth, speedy, spotless, character,
                            remark_1, remark_2, moderation_status, inspected_on)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   5, 4, 4, 5,
   'Rides like butter. Doors close like they are',
   'mad at you. Plays smooth jazz, inexplicably.',
   'approved', date '2026-08-29'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   4, 4, 5, 4,
   'Confirmed the jazz. Cannot confirm the genre.',
   'Mirror is immaculate. Suspiciously so.',
   'approved', date '2026-08-30'),
  -- The CONDEMNED one. Nobody screenshots a 4.5.
  ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   1, 1, 1, 1,
   'Screams on the way up. Sighs on the way down.',
   'Something is loose. Possibly everything.',
   'approved', date '2026-08-31'),
  ('bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   5, 5, 4, 3,
   'Fifty-five floors in under a minute. My ears',
   'have filed a formal complaint.',
   'approved', date '2026-08-31')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- A wider spread so search and the recent-findings feed have something to show.
-- Real buildings and real addresses; the findings are invented, obviously.

insert into public.buildings (id, name, address_line, city, region, country, postal_code,
                              location, metro_code, created_by)
values
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Ponce City Market', '675 Ponce De Leon Ave NE',
   'Atlanta', 'GA', 'US', '30308',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-84.3660, 33.7726), 4326)::extensions.geography,
   'ATL', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'The Empire State Building', '20 W 34th St',
   'New York', 'NY', 'US', '10001',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-73.9857, 40.7484), 4326)::extensions.geography,
   'NYC', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Salesforce Tower', '415 Mission St',
   'San Francisco', 'CA', 'US', '94105',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-122.3969, 37.7897), 4326)::extensions.geography,
   'SFO', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Willis Tower', '233 S Wacker Dr',
   'Chicago', 'IL', 'US', '60606',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-87.6359, 41.8789), 4326)::extensions.geography,
   'CHI', '22222222-2222-4222-8222-222222222222')
on conflict (id) do nothing;

insert into public.elevators (id, building_id, label, manufacturer, model, capacity_lb,
                              floors_served, install_year, created_by)
values
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000003',
   'Market Hall Freight', 'Otis', 'Series 1', 5000, 5, '1926',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000003',
   'Tower Car 1', 'Schindler', '5500', 2500, 9, '2014',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000004',
   'Observatory Express', 'Otis', 'Gen2', 3000, 86, '1931',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000004',
   'Lobby Bank C', 'Otis', 'SkyRise', 2500, 40, '2009',
   '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000005',
   'Sky Lobby A', 'Kone', 'UltraRope', 3500, 61, '2018',
   '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000006',
   'Skydeck Express', 'ThyssenKrupp', 'Evolution', 3000, 103, '1973',
   '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000006',
   'Parking Level Car', 'Dover', 'Impulse', 4000, 8, '1981',
   '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

insert into public.ratings (elevator_id, author_id, smooth, speedy, spotless, character,
                            remark_1, remark_2, moderation_status, inspected_on)
values
  ('bbbbbbbb-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
   2, 2, 2, 5,
   'Older than my grandmother and twice as loud.',
   'Genuinely magnificent. Would ride again.',
   'approved', date '2026-08-27'),
  ('bbbbbbbb-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222',
   5, 5, 5, 2,
   'Flawless. Utterly without personality.',
   'The elevator equivalent of a beige wall.',
   'approved', date '2026-08-28'),
  ('bbbbbbbb-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
   4, 3, 5, 5,
   'Eighty-six floors. Ears popped twice.',
   'Worth it. The brass is immaculate.',
   'approved', date '2026-08-26'),
  ('bbbbbbbb-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222',
   4, 2, 4, 3,
   'Waited four minutes at lunchtime. Four.',
   null,
   'approved', date '2026-08-29'),
  ('bbbbbbbb-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
   5, 5, 5, 4,
   'Sixty-one floors and I felt nothing at all.',
   'Suspiciously smooth. What is it hiding?',
   'approved', date '2026-08-30'),
  ('bbbbbbbb-0000-4000-8000-000000000009', '22222222-2222-4222-8222-222222222222',
   3, 4, 3, 4,
   'Rattles above floor 90. Everyone pretends',
   'not to notice. I noticed.',
   'approved', date '2026-08-30'),
  ('bbbbbbbb-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111',
   1, 1, 1, 2,
   'Smells like 1981 and sounds like a threat.',
   'The doors close at their own discretion.',
   'approved', date '2026-08-31')
on conflict do nothing;
