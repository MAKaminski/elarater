# ElaRater — scaffold handoff package

Everything Claude Code needs to stand up ElaRater as **one codebase** shipping to
iOS, Android, and web.

## Read in this order

| # | File | What it is |
|---|---|---|
| 0 | `CLAUDE.md` | Project guardrails. Load this first and keep it loaded. |
| 1 | `docs/01-product-spec.md` | What the product is and what ships in v1 |
| 2 | `docs/02-architecture.md` | System architecture by layer + stack decision |
| 3 | `docs/03-erd.md` | Full backend ERD |
| 4 | `docs/04-design-system.md` | Tokens → components |
| 5 | `docs/05-certificate-spec.md` | The certificate renderer (the core artifact) |
| 6 | `docs/06-store-compliance.md` | Apple + Google requirements — read before writing auth or feed |
| 7 | `docs/07-scaffold-plan.md` | Phased build order with acceptance criteria |

## Stack decision (short version)

**Expo (SDK 54+) + Expo Router + react-native-web + Supabase.** One codebase, three
targets. `docs/02-architecture.md` has the reasoning and the one honest trade-off.

## What's in here

```
brand/
  v3/            CANONICAL. Certificate direction. SVG source + PNG exports + BRAND.md
  v2/            Archived — "lobby daylight". Reference only.
  v1/            Archived — industrial. Reference only.
  fonts/         Alfa Slab One, Archivo, Courier Prime (+ Gabarito, Figtree for v2)
                 All SIL Open Font License. OFL-*.txt included. Safe to bundle.
  tokens/        design-tokens.json — the single source of truth for colour and type
app-assets/
  ios/           AppIcon 1024 + legacy sizes
  android/       Adaptive icon foreground / background / monochrome (432×432), Play 512
  web/           Favicon, PWA 192/512, splash, OG image
docs/            Specs listed above
```

`brand/v3/_generator_*.py` are the Python scripts that produced the certificate.
They are reference for how the geometry was derived — the app renders certificates
natively, not by running these.

## Do not

- Mix v1/v2 colours into v3. They are three separate systems; v3 is the one shipping.
- Re-lay-out the certificate. Scale the 900×662 canvas; never reflow it.
- Redesign the wordmark. Two-tone `Ela` + `Rater` is load-bearing.
