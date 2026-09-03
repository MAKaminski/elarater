-- Guest inspectors.
--
-- Magic-link delivery needs SMTP, so until that is wired nobody could sign in and
-- therefore nobody could rate anything. Anonymous sign-in creates a real auth user
-- and a real profiles row, so every guard still applies: the terms gate, one rating
-- per elevator per day, and remark screening.
--
-- Anonymous users have no email, so the handle derivation has to cope with null.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate text;
  suffix    text := substr(replace(new.id::text, '-', ''), 1, 6);
  is_guest  boolean := coalesce(new.is_anonymous, false) or new.email is null;
begin
  if is_guest then
    candidate := 'guest_' || suffix;
  else
    candidate := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    if length(candidate) < 3 then
      candidate := 'inspector';
    end if;
    candidate := left(candidate, 14) || suffix;
  end if;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    candidate,
    case when is_guest then 'Guest Inspector ' || upper(substr(suffix, 1, 4))
         else split_part(new.email, '@', 1) end
  );
  return new;
end;
$$;
