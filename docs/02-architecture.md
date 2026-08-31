# 02 — Systems architecture

## Stack decision

**Expo + Expo Router + react-native-web + Supabase.** One repo, one component tree,
three targets.

| Option | Verdict |
|---|---|
| **Expo + Expo Router** | **Chosen.** True single codebase. File-based routing maps to real web URLs, which matters because certificate permalinks are the sharing surface. `react-native-svg` renders the certificate identically on all three targets. EAS handles both store builds. |
| Flutter | One codebase, but web output is canvas-rendered — bad for certificate permalinks, SEO, and OG scraping. The whole growth loop is links. |
| Next.js + Capacitor | Great web, but the rate flow needs camera, GPS, and offline queueing. Capacitor makes those second-class. |
| Native ×2 + separate web | Three codebases, three drifts. Explicitly what you asked to avoid. |

### The one honest trade-off

`react-native-web` produces a worse marketing site than Next.js would — heavier JS
payload, weaker SEO, and OG image generation needs an Edge Function instead of
Next's built-in `ImageResponse`. The mitigation is in the architecture below
(static-export the marketing routes, render OG server-side in Supabase).

If organic search becomes a primary channel later, split *only* the marketing site
to Next.js and keep the app in Expo. Don't split the app. For v1, one codebase is
the right call and the SEO cost is small.

---

## Layer breakdown

### Front-end — user interface

```
app/                          Expo Router — file-based, URLs are real
  (marketing)/                Public web-only routes, static-exported
    index.tsx                 Landing
    c/[serial].tsx            Certificate permalink — the share target
  (tabs)/
    index.tsx                 Nearby elevators
    search.tsx
    profile.tsx
  rate/[elevatorId].tsx       The 4-tap rate flow
  elevator/[id].tsx
  building/[id].tsx
  settings/                   Account, privacy, delete account
components/
  primitives/                 The 8 primitives in CLAUDE.md. Nothing else.
  certificate/
    Certificate.tsx           900×662 SVG, scaled by transform. Never reflowed.
    Seal.tsx
    Frame.tsx                 Brass frame + screws for share exports
theme/
  tokens.ts                   Generated from brand/tokens/design-tokens.json
```

Platform differences live in `.native.tsx` / `.web.tsx` file suffixes only. If a
component needs more than a suffix split, it's the wrong abstraction.

State: TanStack Query for anything from the server. `useState` for the rest. No
Redux — there is no global client state worth the ceremony.

### Middleware — APIs and boundaries

```
lib/
  supabase.ts                 Typed client, generated types from the DB
  api/                        One module per entity: elevators, ratings, buildings
  schemas/                    Zod schemas — validate at EVERY boundary
  certificate/
    serial.ts                 Serial parsing/formatting (generation is server-side)
    bands.ts                  Score → quality band
    render.ts                 Certificate props → SVG element
  offline/
    queue.ts                  Ratings created offline, flushed on reconnect
```

Rules:
- Every network response passes through a Zod schema before it touches a component.
- DB types are generated (`supabase gen types typescript`), never hand-written.
- No component imports the Supabase client directly. Only `lib/api/*` does.

### Back-end — data and logic

Supabase. Postgres 15 + PostGIS.

| Piece | Purpose |
|---|---|
| Tables + RLS | See `03-erd.md`. RLS on from day one. |
| `search_nearby_elevators(lat, lng, radius_m)` | PostGIS RPC — geography index, not a client-side filter |
| Trigger `ratings_after_insert` | Recomputes `elevators.score_avg`, `rating_count`; assigns certificate serial |
| Edge Function `render-certificate` | Deno + resvg → PNG for OG images and share fallback |
| Edge Function `moderate-remarks` | Screens remarks on submit. Compliance-critical. |
| Edge Function `delete-account` | Hard-deletes user data. Compliance-critical. |
| Storage buckets | `photos/` (user uploads), `certificates/` (rendered PNGs, public read) |

Score is computed in the trigger, never trusted from the client.

### Infrastructure — deployment

| Target | How |
|---|---|
| iOS | EAS Build → TestFlight → App Store. `PrivacyInfo.xcprivacy` in the config plugin. |
| Android | EAS Build → AAB → Play Console. Adaptive icon from `app-assets/android/`. |
| Web | `npx expo export -p web` → static → Vercel or Cloudflare Pages |
| Backend | Supabase cloud. Migrations in `supabase/migrations/`, applied via CI. |
| CI | GitHub Actions: typecheck → test → migration check → EAS build on tag |
| Env | `.env.local` dev, EAS secrets for build, Supabase project per environment |

Two Supabase projects: `elarater-dev` and `elarater-prod`. Never point a dev client
at prod.

---

## Request flow — submitting a rating

```
User taps 4 scores + types remarks
        │
        ▼
  Zod validate (lib/schemas/rating.ts)
        │
        ├─ offline? → offline/queue.ts, optimistic certificate, flush later
        ▼
  lib/api/ratings.create()
        │
        ▼
  Supabase insert → RLS check (user owns the rating)
        │
        ▼
  Edge Function moderate-remarks  ── fails ──► rejected, user edits
        │ passes
        ▼
  Trigger ratings_after_insert
        ├─ assign serial  ATL-004572
        ├─ compute score + band
        └─ recompute elevators.score_avg
        │
        ▼
  Certificate row → client renders SVG immediately
        │
        ▼
  render-certificate (async) → certificates/ATL-004572.png
        │
        ▼
  Permalink /c/ATL-004572 with OG image ready for sharing
```

## Component reuse map

Every screen is assembled from the same eight primitives. This is the anti-drift
mechanism — if a new screen needs a new component, the screen is wrong.

| Screen | Primitives used |
|---|---|
| Nearby | WallSurface, PaperSurface, ScoreDisplay, FormLabel, Rule |
| Rate flow | WallSurface, Lantern, FormLabel, TypedValue |
| Certificate | PaperSurface, StampSeal, FormLabel, TypedValue, Rule, ScoreDisplay |
| Elevator page | WallSurface, PaperSurface, ScoreDisplay, Rule |
| Profile | WallSurface, PaperSurface, ScoreDisplay, FormLabel |
| Settings | WallSurface, FormLabel, Rule |
| Marketing | PaperSurface, StampSeal, all certificate parts |
