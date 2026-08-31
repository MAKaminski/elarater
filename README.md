# ElaRater

Rate the elevator you are standing in. Get back an official-looking inspection
certificate you actually want to post.

**Live:** https://elarater.vercel.app · [`ATL-000003`](https://elarater.vercel.app/c/ATL-000003) is the CONDEMNED one.

One Expo codebase shipping to iOS, Android and web. The certificate is the product:
it is the rating result screen, the share image, the web permalink and the marketing
asset — one component, four uses.

## Getting started

```bash
npm install
supabase start      # requires Docker; the app defaults to this stack in development
npm run gen         # design tokens + baked glyph outlines
npm start
```

No environment file is needed for development — `getSupabase()` defaults to the local
stack. Production configuration lives only in the Vercel project. See `env.example`.

## Layout

| Path | What |
|---|---|
| `src/app/` | Expo Router routes. URLs are real; `/c/[serial]` is the sharing surface. |
| `src/components/primitives/` | The eight primitives. There is no ninth. |
| `src/lib/certificate/` | `geometry.ts` is the single source of every coordinate. |
| `supabase/migrations/` | The whole schema, RLS on from day one. |
| `api/` | Vercel Functions: the Expo server entry, the permalink, the OG renderer. |
| `docs/` | The specs this was built from. `CLAUDE.md` is the guardrail file. |
| `ARCHITECTURE.md` | ERD and inventory, generated from the live schema. |

## Commands

| Command | Does |
|---|---|
| `npm start` | Dev server for all three targets |
| `npm run gen` | Regenerate `theme/tokens.ts` and `certificate/glyphs.gen.ts` |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm test` | Score bands, remark moderation, seal arc-text orientation |
| `npm run verify:certificate` | Pixel-diff against `brand/v3/certificate-hero.svg` |
| `npm run test:rls` | RLS policy negatives against the local stack |
| `npm run arch:check` | Fail if `ARCHITECTURE.md` has drifted |
| `npm run build:web` | Production web build (`dist/client` + `dist/server`) |

## Licences

Alfa Slab One, Archivo and Courier Prime are SIL Open Font License; the licence files
ship alongside them in `assets/fonts/` and `brand/fonts/`.
