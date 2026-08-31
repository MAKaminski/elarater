# 05 — Certificate renderer spec

The certificate is the product. It is the rating result screen, the share image, the
web permalink, and the marketing asset — one component, four uses.

## Canvas

Authored at **900 × 662**. Always rendered inside an SVG with
`viewBox="0 0 900 662"` and `preserveAspectRatio="xMidYMid meet"`. Scale it with the
container. **Never reflow the fields for a smaller screen.** On a narrow phone the
certificate gets smaller, exactly like a real one behind glass.

Reference implementation: `brand/v3/certificate-hero.svg` is the exact output target.
`brand/v3/_generator_build3.py` shows how every coordinate was derived — port
`certificate()` from that file to `components/certificate/Certificate.tsx` using
`react-native-svg`.

## Fixed chrome — never changes

- Manila ground `stock`, guilloche wave pattern in `tint` at 50%
- Double `brass` border, 3.5px outer at inset 17, 1.2px inner at inset 27
- Four `brass` diamonds at inner corners
- "OFFICE OF RIDE QUALITY" eyebrow, `ElaRater` two-tone wordmark
- "CERTIFICATE OF RIDE QUALITY" / "ISSUED UNDER THE VERTICAL TRANSPORT ACT OF 2026"
- Field labels, rules, "FINDING OF THE INSPECTOR", "OUT OF FIVE"
- "AUTHORIZED INSPECTOR" line + signature squiggle
- "VOID IF REMOVED FROM CAR" footer

## The nine variables

| Prop | Type | Limit | Position (900×662 space) |
|---|---|---|---|
| `location` | string | 28 ch | x60 y300, field width 470 |
| `serial` | string | 16 ch | x566 y300 w274, plus `No. {serial}` at x840 y84 right-aligned |
| `manufacturer` | string | 18 ch | x60 y372 w300 |
| `capacity` | string | 11 ch | x396 y372 w190 |
| `floors` | string | 12 ch | x622 y372 w218 |
| `score` | number 0–5, .5 steps | — | x58 y512, Alfa Slab 104 |
| `band` | enum | — | x(68+scoreWidth) y512, "RIDE QUALITY: {band}" |
| `remark1` / `remark2` | string | 48 ch each | x60 y588 / y608, Courier 15 |
| `inspectedOn` | YYYY-MM-DD | — | x840 y106 right-aligned |

Character limits are enforced in the DB (`remark_len` constraint) and in Zod. They are
not suggestions — 49 characters overruns the field and breaks the layout.

## Bands

| Score | Band | Score colour | Seal colour |
|---|---|---|---|
| 4.5 – 5.0 | EXCELLENT | `office` | `stamp` |
| 3.5 – 4.4 | SATISFACTORY | `office` | `stamp` |
| 2.5 – 3.4 | ACCEPTABLE | `office` | `stamp` |
| 1.5 – 2.4 | DEFICIENT | `stamp` | `stamp` |
| 0.0 – 1.4 | CONDEMNED | `stamp` | `stamp` |

### CONDEMNED variant — build this, it's the growth engine

Below 1.5 the certificate changes:
- Score numeral and "OUT OF FIVE" in `stamp`
- Seal gains a second concentric ring and reads **CONDEMNED** on the bottom arc
  instead of "OFFICE OF RIDE QUALITY"
- A `stamp` diagonal band across the lower-left corner: "OUT OF SERVICE" at −22°,
  6% opacity fill behind the form, 100% on the band text
- Footer becomes "VOID IF REMOVED FROM CAR · NOTICE POSTED BY ORDER"

Nobody shares a 4.5. They share the 1.2 for the freight elevator at work. Make this
variant unmistakable at thumbnail size.

## Seal

Circular, struck at −8°, `stamp` at 88% opacity.
- Outer ring r, stroke r×0.055; inner ring r×0.80, stroke r×0.022
- Top arc "ELARATER", bottom arc "OFFICE OF RIDE QUALITY" (or "CONDEMNED")
- Centre: `Lantern` at r×0.44, year below at r×0.20

Arc text: place each glyph individually. Top arc baseline sits at
`radius − 0.74 × fontSize` so glyph bodies fall inside the ring; bottom arc baseline
sits at `radius` with bodies extending inward. Bottom glyphs are **not** flipped 180° —
they read upright along the curve. (Getting this wrong renders the text mirrored; it
was the one real bug in the source generator.)

## Three render paths

| Path | How | Used for |
|---|---|---|
| In-app | `react-native-svg`, live component | Rate result, elevator page, profile |
| Share export | `react-native-view-shot` → 1080×1080 PNG on `wall` bg, inside brass `Frame` | Share sheet |
| Server | Edge Function `render-certificate`, Deno + `resvg-js` → PNG to `certificates/` | OG images, web permalinks, fallback |

The server path must produce a pixel-identical certificate. Share the same geometry
constants — put them in `lib/certificate/geometry.ts` and import from both the RN
component and the Edge Function. Do not maintain two copies of the coordinates.

## Framing rule

In every share export and social render the certificate appears **framed and screwed
to a wall** — brass frame, four screws, `wall` background with brushed vertical lines.
Never floating on white. The frame is what makes it read as a real posted document
rather than a graphic.
