# 0001 — Render certificate OG images on Vercel, not a Supabase Edge Function

- **Date:** 2026-08-31
- **Status:** Accepted
- **Supersedes:** `docs/02-architecture.md` "Edge Function `render-certificate`" and
  `docs/05-certificate-spec.md` "Server render path"

## Context

The written architecture static-exports the web app and renders certificate OG images
in a Deno Edge Function on Supabase. The deployment target is Vercel, and the
certificate permalink is the entire growth loop — "the whole growth loop is links".

Both docs also state a hard rule: geometry constants live in exactly one file,
imported by both render paths. "Do not maintain two copies of the coordinates."

## Decision

Run Expo Router's server output (`web.output: "server"`) on Vercel, and render OG
images in a Vercel Function that imports the same `lib/certificate/geometry.ts` the
react-native-svg component uses.

Supabase keeps Postgres, Auth, Storage, RLS, and the two Edge Functions that genuinely
need service-role access: `moderate-remarks` and `delete-account`.

## Consequences

- One copy of the coordinates, enforced by the module graph rather than by discipline.
  A Deno function would have needed its own import path into a Metro-oriented tree.
- Permalinks get real server-rendered HTML instead of a static shell, which is
  strictly better for the sharing surface than the docs assumed.
- One runtime instead of two. No Deno in the certificate path.
- `@resvg/resvg-wasm` needs no fonts, because the emitted SVG contains zero `<text>`
  elements — see `0002`.
- **Cost:** Vercel Functions are now on the critical path for link previews. The OG
  response is cached hard (`s-maxage=86400, immutable`) since a certificate is
  immutable once issued.

## Wrinkle discovered during implementation

Expo prerenders a dynamic route **once**, into a shell whose `<head>` still contains
the literal `[serial]`. That shell is what Vercel serves, so every shared link
unfurled as "[SERIAL]". `api/c.ts` re-serves the same shell with the head rewritten
per request: humans get the identical SPA and hydrate normally, scrapers get real
tags. The sentinel strings live in `lib/certificate/og.ts`, imported by both sides.
