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
