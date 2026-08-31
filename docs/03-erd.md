# 03 — Entity relationship diagram

Nine tables. Every one carries `id uuid pk`, `created_at`, `updated_at`. Consistency
over cleverness — same shape everywhere means less to remember.

```mermaid
erDiagram
    PROFILES ||--o{ RATINGS : writes
    PROFILES ||--o{ PHOTOS : uploads
    PROFILES ||--o{ VOTES : casts
    PROFILES ||--o{ REPORTS : files
    PROFILES ||--o{ BLOCKS : initiates
    PROFILES ||--o{ BLOCKS : "is target of"

    BUILDINGS ||--o{ ELEVATORS : contains

    ELEVATORS ||--o{ RATINGS : receives
    ELEVATORS ||--o{ PHOTOS : "is shown in"

    RATINGS ||--|| CERTIFICATES : issues
    RATINGS ||--o{ VOTES : receives
    RATINGS ||--o{ PHOTOS : includes
    RATINGS ||--o{ REPORTS : "is target of"

    PROFILES {
        uuid id PK "= auth.users.id"
        text handle UK "3-20 chars, lowercase"
        text display_name
        text avatar_path "storage key, nullable"
        text home_metro "ATL, NYC — drives serial prefix"
        int  inspection_count "denormalised, trigger-maintained"
        bool is_suspended
        timestamptz deleted_at "soft delete; hard purge after 30d"
        timestamptz created_at
        timestamptz updated_at
    }

    BUILDINGS {
        uuid id PK
        text name
        text address_line
        text city
        text region "state / province"
        text country "ISO 3166-1 alpha-2"
        text postal_code
        geography location "POINT 4326, GIST indexed"
        text metro_code "ATL — denormalised for serials"
        int  elevator_count "trigger-maintained"
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    ELEVATORS {
        uuid id PK
        uuid building_id FK
        text label "'North Bank Car 2'"
        text manufacturer "nullable — Otis, Kone, Schindler"
        text model "nullable — Gen2"
        int  capacity_lb "nullable"
        int  floors_served "nullable"
        text install_year "nullable"
        numeric score_avg "1 decimal, trigger-maintained"
        int  rating_count "trigger-maintained"
        text current_band "EXCELLENT..CONDEMNED, trigger-maintained"
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    RATINGS {
        uuid id PK
        uuid elevator_id FK
        uuid author_id FK
        int  smooth "1-5"
        int  speedy "1-5"
        int  spotless "1-5"
        int  character "1-5"
        numeric score "DERIVED — trigger only, never client"
        text band "DERIVED"
        text remark_1 "<=48 chars, nullable"
        text remark_2 "<=48 chars, nullable"
        text moderation_status "pending|approved|rejected"
        text moderation_reason "nullable"
        bool is_hidden "set by moderation or report resolution"
        timestamptz inspected_on "date the ride happened"
        timestamptz created_at
        timestamptz updated_at
    }

    CERTIFICATES {
        uuid id PK
        uuid rating_id FK UK "1:1 with rating"
        text serial UK "ATL-004572 — server-generated"
        text metro_code
        int  sequence "per-metro monotonic"
        text render_path "storage key for the PNG, nullable until rendered"
        int  share_count
        int  view_count
        timestamptz issued_at
        timestamptz created_at
        timestamptz updated_at
    }

    PHOTOS {
        uuid id PK
        uuid elevator_id FK
        uuid rating_id FK "nullable"
        uuid uploader_id FK
        text storage_path
        int  width
        int  height
        text moderation_status "pending|approved|rejected"
        bool is_hidden
        timestamptz created_at
        timestamptz updated_at
    }

    VOTES {
        uuid id PK
        uuid rating_id FK
        uuid voter_id FK
        int  value "+1 only in v1 — 'this is accurate'"
        timestamptz created_at
        timestamptz updated_at
    }

    REPORTS {
        uuid id PK
        text target_type "rating|photo|profile"
        uuid target_id
        uuid reporter_id FK
        text reason "spam|harassment|inaccurate|explicit|other"
        text detail "nullable"
        text status "open|actioned|dismissed"
        uuid resolved_by "nullable"
        timestamptz resolved_at "SLA: within 24h of created_at"
        timestamptz created_at
        timestamptz updated_at
    }

    BLOCKS {
        uuid id PK
        uuid blocker_id FK
        uuid blocked_id FK
        timestamptz created_at
        timestamptz updated_at
    }
```

## Constraints and indexes

```sql
-- one rating per user per elevator per day: stops score farming
create unique index ratings_author_elevator_day
  on ratings (author_id, elevator_id, (inspected_on::date));

-- one vote per user per rating
create unique index votes_unique on votes (rating_id, voter_id);

-- one block per pair, no self-blocks
create unique index blocks_unique on blocks (blocker_id, blocked_id);
alter table blocks add constraint no_self_block check (blocker_id <> blocked_id);

-- geo lookup
create index buildings_location_gist on buildings using gist (location);

-- feed and permalink paths
create index ratings_elevator_created on ratings (elevator_id, created_at desc)
  where is_hidden = false;
create unique index certificates_serial on certificates (serial);

-- sub-scores are 1-5
alter table ratings add constraint subscores_in_range check (
  smooth between 1 and 5 and speedy between 1 and 5 and
  spotless between 1 and 5 and character between 1 and 5);

-- remarks length is a hard constraint, not a UI suggestion:
-- longer text overruns the certificate field and breaks the layout
alter table ratings add constraint remark_len check (
  coalesce(length(remark_1),0) <= 48 and coalesce(length(remark_2),0) <= 48);
```

## Derived-value rules

| Value | Owner | Rule |
|---|---|---|
| `ratings.score` | trigger | `round((smooth+speedy+spotless+character)/4.0 * 2) / 2` |
| `ratings.band` | trigger | from `design-tokens.json → certificate.bands` |
| `elevators.score_avg` | trigger | mean of visible, approved ratings |
| `elevators.current_band` | trigger | band of `score_avg` |
| `certificates.serial` | trigger | `{metro_code}-{lpad(nextval, 6, '0')}` |
| `profiles.inspection_count` | trigger | count of visible ratings |

The client never writes any of these. If a client sends one, reject the insert.

## RLS posture

| Table | Read | Write |
|---|---|---|
| profiles | public where `deleted_at is null and not is_suspended` | own row |
| buildings | public | authenticated insert; update by creator or moderator |
| elevators | public | authenticated insert; update by creator or moderator |
| ratings | public where `not is_hidden and moderation_status='approved'`; own rows always | insert own; update own within 15 min; delete own |
| certificates | public where parent rating visible | none — trigger only |
| photos | public where visible | insert own; delete own |
| votes | public aggregate | insert/delete own |
| reports | own rows only | insert own |
| blocks | own rows only | insert/delete own |

**Blocks must filter the feed.** Any query returning ratings excludes authors the
viewer has blocked, and authors who have blocked the viewer. Put this in a view
(`visible_ratings`) so no query can forget it.
