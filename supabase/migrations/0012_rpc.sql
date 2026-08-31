/**
 * Nearby discovery. A PostGIS geography index, not a client-side filter — real
 * GPS-based discovery is one of the four defences against an Apple 4.2 rejection
 * (docs/06-store-compliance.md, "Minimum functionality").
 */
create or replace function public.search_nearby_elevators(
  lat double precision,
  lng double precision,
  radius_m double precision default 250
)
returns table (
  elevator_id     uuid,
  label           text,
  manufacturer    text,
  model           text,
  floors_served   int,
  capacity_lb     int,
  score_avg       numeric,
  rating_count    int,
  current_band    text,
  building_id     uuid,
  building_name   text,
  address_line    text,
  city            text,
  metro_code      text,
  distance_m      double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select e.id, e.label, e.manufacturer, e.model, e.floors_served, e.capacity_lb,
         e.score_avg, e.rating_count, e.current_band,
         b.id, b.name, b.address_line, b.city, b.metro_code,
         extensions.ST_Distance(b.location, origin.g) as distance_m
    from (select extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography as g) origin
    join public.buildings b
      on extensions.ST_DWithin(b.location, origin.g, least(greatest(radius_m, 25), 5000))
    join public.elevators e on e.building_id = b.id
   order by distance_m asc, e.label asc
   limit 100;
$$;

/** Serial -> everything the permalink needs, in one round trip. */
create or replace function public.certificate_by_serial(p_serial text)
returns setof public.visible_ratings
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.visible_ratings where serial = upper(p_serial) limit 1;
$$;
