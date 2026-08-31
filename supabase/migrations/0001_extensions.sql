-- PostGIS drives nearby discovery; docs/06-store-compliance.md calls real GPS-based
-- discovery one of the four defences against an Apple 4.2 "just a form" rejection.
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- Every table carries id / created_at / updated_at. No exceptions — consistency over
-- cleverness means less to remember (CLAUDE.md, "Data rules").
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
