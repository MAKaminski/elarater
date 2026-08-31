# 07 — Scaffold plan

Eight phases. Each has acceptance criteria. Meet them before moving on — that's the
anti-drift mechanism.

## Phase 0 — Foundation

```bash
npx create-expo-app@latest elarater --template tabs
cd elarater && npx expo install expo-router react-native-svg expo-font \
  expo-location expo-image-picker expo-secure-store react-native-view-shot \
  @supabase/supabase-js @tanstack/react-query zod
```

- TypeScript strict, ESLint + Prettier
- Copy `brand/fonts/*.ttf` → `assets/fonts/`, register with `expo-font`
- Script `scripts/tokens.ts`: `design-tokens.json` → `theme/tokens.ts`
- Two Supabase projects: `elarater-dev`, `elarater-prod`

**Done when:** app boots on iOS sim, Android emulator, and web from one `npm start`.
Alfa Slab One, Archivo, and Courier Prime all render on all three.

## Phase 1 — Design primitives

Build the eight primitives from `04-design-system.md`. Nothing else.

**Done when:** a `/dev/primitives` route renders every primitive in every state on
all three platforms, pixel-consistent.

## Phase 2 — The certificate

Port `certificate()` from `brand/v3/_generator_build3.py` to
`components/certificate/Certificate.tsx`. Geometry constants in
`lib/certificate/geometry.ts`, importable by both the component and the Edge Function.

**Done when:** `<Certificate {...sample} />` is visually identical to
`brand/v3/certificate-hero.svg` at 900×662; scales cleanly to 320px wide; CONDEMNED
variant renders; arc text on the seal reads correctly (not mirrored) on all three targets.

## Phase 3 — Backend

Migrations for all nine tables from `03-erd.md`, with constraints, indexes, RLS,
triggers, and the `visible_ratings` view. PostGIS `search_nearby_elevators` RPC.
Generate TS types.

**Done when:** `supabase db reset` builds the whole schema clean; RLS policy tests
pass (a user cannot read another's hidden rating, cannot write a derived column,
cannot see a blocked author).

## Phase 4 — Auth + compliance skeleton

Do compliance **now**, not at submission. Retrofitting blocks and moderation into an
existing feed is a rewrite.

- Email magic link + Sign in with Apple
- Terms acceptance gate before first post
- Report flow, block flow, `visible_ratings` filtering
- In-app account deletion + `delete-account` Edge Function

**Done when:** every item in the `06-store-compliance.md` checklist that isn't
listing metadata is functional.

## Phase 5 — Core loop

Nearby discovery (GPS + PostGIS) → elevator page → rate flow → certificate → share.
Offline queue for ratings.

**Done when:** a user can find a real elevator by location, rate it, receive a
certificate with a server-assigned serial, and export a 1080×1080 framed PNG to the
native share sheet. Works airplane-mode with correct flush on reconnect.

## Phase 6 — Web + permalinks

Static-export marketing routes. `/c/[serial]` permalink. `render-certificate` Edge
Function for OG images. Privacy policy, terms, `/delete-account`.

**Done when:** a shared certificate link unfurls with a correct OG image in iMessage,
Slack, X, and LinkedIn.

## Phase 7 — Store submission

EAS Build for both platforms. Icons from `app-assets/`. Privacy manifest, Data Safety
form, age rating 12+/Teen, demo account in review notes.

**Done when:** TestFlight and Play internal testing builds are live and installable.

---

## Guarding against drift

1. `CLAUDE.md` stays loaded for every session.
2. Never add a ninth primitive. If a screen needs one, simplify the screen.
3. Certificate geometry lives in exactly one file, imported by both render paths.
4. Colours come from generated tokens. A literal hex in a component is a bug.
5. When a doc here is wrong, fix the doc in the same commit as the code. Docs that
   drift from the build are worse than no docs.
