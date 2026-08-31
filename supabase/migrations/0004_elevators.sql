create table public.elevators (
  id            uuid primary key default gen_random_uuid(),
  building_id   uuid not null references public.buildings (id) on delete cascade,
  label         text not null,
  manufacturer  text,
  model         text,
  capacity_lb   int,
  floors_served int,
  install_year  text,
  -- All four trigger-maintained. The client never writes these.
  score_avg     numeric(2,1),
  rating_count  int not null default 0,
  current_band  text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint score_avg_range check (score_avg is null or (score_avg >= 0 and score_avg <= 5)),
  constraint band_known check (current_band is null or current_band in
    ('EXCELLENT','SATISFACTORY','ACCEPTABLE','DEFICIENT','CONDEMNED'))
);

create trigger elevators_touch before update on public.elevators
  for each row execute function public.touch_updated_at();

create index elevators_building on public.elevators (building_id);

create or replace function public.sync_building_elevator_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.buildings b
     set elevator_count = (select count(*) from public.elevators e where e.building_id = b.id)
   where b.id = coalesce(new.building_id, old.building_id);
  return null;
end;
$$;

create trigger elevators_count_sync
  after insert or delete on public.elevators
  for each row execute function public.sync_building_elevator_count();
