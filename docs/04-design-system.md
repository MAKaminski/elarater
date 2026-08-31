# 04 — Design system

Source of truth: `brand/tokens/design-tokens.json`. Generate `theme/tokens.ts` from
it at build time; never hand-copy hex values into components.

## Palette

| Token | Hex | Rule |
|---|---|---|
| `stock` | `#EFE9D8` | Certificate paper, light surfaces |
| `stockDeep` | `#E4DCC6` | Pressed state on paper |
| `tint` | `#B9CCB6` | Guilloche only, ≤50% opacity |
| `ink` | `#1E1C17` | Typed values, text on paper |
| `office` | `#0E6B62` | Authority + primary action |
| `officeLight` | `#5FC7B8` | Office ink on dark |
| `stamp` | `#B0342C` | Seal, serial, VOID, CONDEMNED. Nowhere else. |
| `brass` | `#B08A3C` | Rules, frames, screws |
| `fade` | `#7A7565` | Labels, small print, disabled |
| `wall` | `#17332F` | App background |
| `wallLift` | `#1E413C` | Cards, sheets, tab bar |

Two surfaces only: **paper** (light, for certificates and content cards) and **wall**
(dark, for app chrome). Everything sits on one or the other. No third surface.

## Type

| Face | Role | Never |
|---|---|---|
| Alfa Slab One | Wordmark, score numerals, certificate authority line | Body copy, buttons, labels |
| Archivo | Form labels (tracked caps), UI text, headlines | Anything meant to look "typed" |
| Courier Prime | Field values, remarks, serials, dates | Headlines |

The Archivo/Courier split *is* the concept: pre-printed form vs. typed-in-later.
Getting this backwards kills the whole illusion.

Bundle fonts with `expo-font`. All three are SIL OFL — see `brand/fonts/OFL-*.txt`.

## The eight primitives

Build these first, in this order. Every screen composes from them.

```tsx
<FormLabel>LOCATION OF INSTALLATION</FormLabel>   // Archivo 700, tracked, fade, upper
<TypedValue>1180 PEACHTREE ST NE</TypedValue>     // Courier Bold, ink
<Rule />                                          // 1.2px hairline, ink @ 30%
<StampSeal size={92} rotation={-8} />             // the seal, everywhere
<Lantern size={24} color="office" />              // rounded triangle
<PaperSurface>…</PaperSurface>                    // stock + guilloche, radius md
<WallSurface>…</WallSurface>                      // wall + brushed vertical lines
<ScoreDisplay score={4.5} band="EXCELLENT" />     // Alfa numeral + band label
```

Props stay minimal — size, colour token, children. If a primitive is growing a
variant flag for a single screen, the screen is wrong.

### Reuse examples

- Loading state → `StampSeal` rotating slowly. Not a spinner.
- Empty state → `StampSeal` at 30% opacity + `FormLabel` "NO INSPECTIONS ON RECORD".
- Error state → `StampSeal` in `stamp` + `FormLabel` "INSPECTION FAILED".
- List row → `PaperSurface` + `ScoreDisplay` + `FormLabel` + `Rule`.
- Tab bar icons → `Lantern`, filled vs. 40% opacity.

One idea reused eight ways beats eight ideas.

## Motion

Sparse. The brand is a paper document, not an interface that bounces.

| Interaction | Motion |
|---|---|
| Certificate issued | Seal stamps down — scale 1.6→1, opacity 0→0.9, 260ms ease-out, tiny rotation settle |
| Score reveal | Numeral counts up over 400ms |
| Page transition | Cross-fade 180ms. No slide. |
| Everything else | None |

The seal stamp is the one moment of delight. Don't dilute it by animating other things.

## Spacing and shape

4pt base: `xs 4 · sm 8 · md 16 · lg 24 · xl 40 · xxl 64`.
Radius: `sm 3` (paper cards) · `md 8` · `lg 16` (sheets) · `pill 999` (chips).
Documents want tight radii. Nothing on paper exceeds `md`.

## Accessibility

- `ink` on `stock` = 12.6:1. `stock` on `wall` = 11.9:1. Both pass AAA.
- `fade` on `stock` = 4.6:1 — passes AA for text ≥16px only. Never use `fade` below 16px
  for anything the user must read. Form labels are decorative context; the value below
  them carries the meaning.
- `stamp` on `stock` = 5.1:1 — AA. Fine.
- Certificate SVG needs an `accessibilityLabel` reading the full finding aloud:
  "Certificate ATL-004572. Otis Gen2 at 1180 Peachtree Street. Rated 4.5 out of 5,
  excellent."
- Minimum touch target 44×44. The four rate-flow score pickers must be large — they're
  the primary interaction.
- Respect `prefers-reduced-motion`: skip the stamp animation, show the seal placed.
