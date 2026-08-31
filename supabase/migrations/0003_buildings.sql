create table public.buildings (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address_line   text not null,
  city           text not null,
  region         text,
  country        text not null default 'US',
  postal_code    text,
  location       extensions.geography(Point, 4326) not null,
  -- Denormalised so the serial trigger never has to reverse-geocode.
  metro_code     text not null,
  elevator_count int not null default 0,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint country_iso  check (country ~ '^[A-Z]{2}$'),
  constraint metro_shape  check (metro_code ~ '^[A-Z]{2,4}$')
);

create trigger buildings_touch before update on public.buildings
  for each row execute function public.touch_updated_at();

create index buildings_location_gist on public.buildings using gist (location);
create index buildings_city on public.buildings (city);
