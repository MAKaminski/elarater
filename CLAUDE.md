# CLAUDE.md — ElaRater

Keep this loaded for the whole build. It exists to stop drift.

## What ElaRater is

An app for rating elevators. Every rating produces an **inspection certificate** —
a parody of the real framed certificate every elevator legally carries. ElaRater is
the fictional "Office of Ride Quality". The certificate is the product's core
artifact: it's the rating screen, the share image, and the marketing asset, all one
thing.

## Stack — do not substitute

| Layer | Choice |
|---|---|
| Front-end | Expo SDK 54+, Expo Router (file-based), React Native + react-native-web |
| Middleware | Supabase JS client, TanStack Query, Zod at every boundary |
| Back-end | Supabase — Postgres + PostGIS, RLS, Auth, Storage, Edge Functions (Deno) |
| Infrastructure | Supabase cloud, EAS Build/Submit for stores, Vercel or Cloudflare Pages for web export |
| Certificate render | `react-native-svg` — one component, three targets |

TypeScript strict everywhere. No `any`.

## Non-negotiable design rules

1. **The form never bends.** The certificate is authored in a 900×662 coordinate
   space. Scale it with a transform. Never reflow fields for a smaller screen.
2. **Nine variables change per certificate.** Location, serial, manufacturer,
   capacity, floors, score, band, two remark lines, date. Everything else is fixed
   chrome.
3. **Colour discipline.** `office` teal = authority and primary action. `stamp`
   oxblood = the seal, serial number, VOID line, and CONDEMNED state — nowhere else.
   `brass` = rules and frames only.
4. **Wordmark is two-tone.** `Ela` in ink, `Rater` in office teal. Never flat.
5. **"VOID IF REMOVED FROM CAR"** appears on every certificate. It's the tell.
6. Certificates in share exports are always framed and screwed to a wall. Never
   floating on white.

## Component discipline

Build a small set of primitives and reuse them relentlessly. Do not invent a new
pattern when an existing one fits.

```
FormLabel     tracked caps, fade colour        — every label in the app
TypedValue    Courier, ink                     — every user/data value
Rule          hairline divider                 — every separator
StampSeal     the circular seal                — icon, certificate, empty states, loaders
Lantern       the rounded triangle             — seal centre, buttons, list bullets
PaperSurface  stock + guilloche                — every light card
WallSurface   wall + brushed lines             — every dark screen background
ScoreDisplay  Alfa Slab numeral + band label   — certificate, list rows, profile
```

If a screen needs something these can't express, that's a signal to simplify the
screen — not to add a tenth primitive.

## Data rules

- Every table has `id uuid pk default gen_random_uuid()`, `created_at timestamptz
  default now()`, `updated_at timestamptz`. No exceptions — consistency over cleverness.
- RLS on every table from day one, including during development.
- Score is **derived**, never written directly: `round(mean(smoothness, speed,
  cleanliness, character) * 2) / 2` → one decimal, half-point steps.
- Serial numbers are generated server-side: `{METRO}-{6-digit sequence}`, e.g.
  `ATL-004572`. Never client-side.
- All dates stored and displayed absolute (`2026-08-31`), never relative.

## Compliance gates — these block launch

Read `docs/06-store-compliance.md` before building auth or the feed. Summary of the
things that get apps rejected:

- **UGC moderation** (Apple 1.2) — filtering, in-app report, block user, published
  contact. Ratings and remarks are UGC. This is the #1 rejection risk for this app.
- **In-app account deletion** — required by both stores. Not a support email.
- **Sign in with Apple** — required if you offer Google/Facebook login.
- **Location purpose strings** — must say what the user gets, not what you collect.
- **Privacy manifest** (`PrivacyInfo.xcprivacy`) + Play Data Safety form.

## Working style

- Build in the phase order in `docs/07-scaffold-plan.md`. Each phase has acceptance
  criteria — meet them before moving on.
- Before adding a dependency, check whether Expo already provides it.
- When something in these docs turns out to be wrong or impossible, say so and
  propose the fix. Don't silently work around it.
