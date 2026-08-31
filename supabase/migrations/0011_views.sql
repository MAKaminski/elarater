/**
 * visible_ratings — the only thing any feed query is allowed to read.
 *
 * "Blocks must filter the feed. Any query returning ratings excludes authors the
 * viewer has blocked, and authors who have blocked the viewer. Put this in a view so
 * no query can forget it." (docs/03-erd.md)
 *
 * security_invoker so the view still runs under the caller's RLS.
 */
create view public.visible_ratings
with (security_invoker = true)
as
select r.*,
       c.serial,
       c.issued_at,
       c.render_path,
       e.building_id,
       e.label        as elevator_label,
       e.manufacturer,
       e.model,
       e.capacity_lb,
       e.floors_served,
       b.name         as building_name,
       b.address_line,
       b.city,
       b.metro_code,
       p.handle       as author_handle,
       p.display_name as author_display_name
  from public.ratings r
  join public.elevators e on e.id = r.elevator_id
  join public.buildings b on b.id = e.building_id
  left join public.certificates c on c.rating_id = r.id
  left join public.profiles p on p.id = r.author_id
 where r.is_hidden = false
   and r.moderation_status = 'approved'
   and not exists (
     select 1 from public.blocks bl
      where (bl.blocker_id = auth.uid() and bl.blocked_id = r.author_id)
         or (bl.blocked_id = auth.uid() and bl.blocker_id = r.author_id)
   );

comment on view public.visible_ratings is
  'Block-filtered, moderation-approved ratings. Feed queries read this, never public.ratings.';
