# 0003 — Local Supabase for development, one cloud project for production

- **Date:** 2026-08-31
- **Status:** Accepted
- **Amends:** `docs/02-architecture.md` "Two Supabase projects: `elarater-dev` and
  `elarater-prod`"

## Context

The docs call for two cloud projects. But Phase 3's own acceptance criterion is
`supabase db reset` building the schema clean — a **local** command. A cloud dev
project cannot be reset that way, and RLS tests want a disposable database.

## Decision

- **Dev:** the local Supabase stack (`supabase start`), requiring Docker.
- **Prod:** one project provisioned through the Vercel Marketplace
  (`vercel integration add supabase`), which injects the environment into the Vercel
  project directly and bills through Vercel.

`getSupabase()` defaults to the local stack's fixed address and publishable key when
`__DEV__` and no environment is set. That key authenticates nothing but 127.0.0.1.

## Consequences

- "Never point a dev client at prod" becomes structural rather than a rule to
  remember: the default *is* local, and prod values exist only in Vercel.
- A fresh clone runs against `supabase start` with no env file to create.
- `supabase db reset` and the RLS suite work as the docs intend.
- **Cost:** Docker is required for development. Migrations reach prod through
  `supabase db push` rather than a dev-to-prod promotion.
- This repo is public. The production service-role key lives only in Supabase's own
  function secrets and never enters the repo or the Vercel project.
