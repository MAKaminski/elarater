-- Discovery without GPS.
--
-- v1 scope is "nearby (GPS), search by building, or scan/enter a building address"
-- (docs/01-product-spec.md). Only the first existed, which meant anyone outside the
-- seeded metro — or on a desktop — hit an empty screen and the app appeared to do
-- nothing. These two RPCs are the other paths in.

create extension if not exists pg_trgm with schema extensions;

create index if not exists buildings_name_trgm
  on public.buildings using gin (name extensions.gin_trgm_ops);
create index if not exists buildings_address_trgm
  on public.buildings using gin (address_line extensions.gin_trgm_ops);
create index if not exists elevators_label_trgm
  on public.elevators using gin (label extensions.gin_trgm_ops);

/**
 * Text search across building name, address, city, and elevator label/manufacturer.
 * Returns the same shape as search_nearby_elevators so the UI renders one row type.
 */
create or replace function public.search_elevators(q text, limit_n int default 50)
returns table (
  elevator_id   uuid,
  label         text,
  manufacturer  text,
  model         text,
  floors_served int,
  capacity_lb   int,
  score_avg     numeric,
  rating_count  int,
  current_band  text,
  building_id   uuid,
  building_name text,
  address_line  text,
  city          text,
  metro_code    text,
  distance_m    double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select e.id, e.label, e.manufacturer, e.model, e.floors_served, e.capacity_lb,
         e.score_avg, e.rating_count, e.current_band,
         b.id, b.name, b.address_line, b.city, b.metro_code,
         null::double precision
    from public.elevators e
    join public.buildings b on b.id = e.building_id
   where q is null or btrim(q) = ''
      or b.name         ilike '%' || q || '%'
      or b.address_line ilike '%' || q || '%'
      or b.city         ilike '%' || q || '%'
      or b.metro_code   ilike '%' || q || '%'
      or e.label        ilike '%' || q || '%'
      or coalesce(e.manufacturer, '') ilike '%' || q || '%'
   order by e.rating_count desc, b.name asc, e.label asc
   limit least(greatest(limit_n, 1), 100);
$$;

/**
 * The most recent findings, for the feed shown when location is off or nothing is
 * nearby. An empty screen reads as a broken app; a wall of certificates does not.
 */
create or replace function public.recent_certificates(limit_n int default 20)
returns setof public.visible_ratings
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.visible_ratings
   where serial is not null
   order by created_at desc
   limit least(greatest(limit_n, 1), 50);
$$;

/** Every elevator in a building, plus the building's own average. */
create or replace function public.building_detail(p_building_id uuid)
returns table (
  building_id   uuid,
  building_name text,
  address_line  text,
  city          text,
  region        text,
  metro_code    text,
  building_avg  numeric,
  elevator_id   uuid,
  label         text,
  manufacturer  text,
  model         text,
  floors_served int,
  capacity_lb   int,
  score_avg     numeric,
  rating_count  int,
  current_band  text
)
language sql
stable
security invoker
set search_path = public
as $$
  select b.id, b.name, b.address_line, b.city, b.region, b.metro_code,
         (select round(avg(e2.score_avg) * 2) / 2
            from public.elevators e2
           where e2.building_id = b.id and e2.score_avg is not null),
         e.id, e.label, e.manufacturer, e.model, e.floors_served, e.capacity_lb,
         e.score_avg, e.rating_count, e.current_band
    from public.buildings b
    join public.elevators e on e.building_id = b.id
   where b.id = p_building_id
   order by e.label asc;
$$;

grant execute on function public.search_elevators(text, int) to anon, authenticated;
grant execute on function public.recent_certificates(int) to anon, authenticated;
grant execute on function public.building_detail(uuid) to anon, authenticated;
