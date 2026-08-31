# ElaRater — brand kit v1

**Concept:** the rating *is* a floor indicator. Hall-lantern arrow + seven-segment
readout, amber on hoistway black. Unlit segments stay faintly visible, the way real
indicator panels look. Nothing here is a generic star rating.

## Palette

| Token | Hex | Use |
|---|---|---|
| Shaft Black | `#0B0C0E` | Backgrounds |
| Panel | `#15181C` | Indicator bezel, cards |
| Rail | `#2A3037` | Hairlines, unlit segments |
| Lantern Amber | `#FFB020` | Primary — lit state, score, CTA |
| Brushed Steel | `#C3CAD2` | Headlines, body |
| Down Red | `#E5484D` | Down lantern only. Never for UI errors. |

## Type

Archivo (Google Fonts, free). Display 700, utility 500–600.
All wordmarks and headlines in the SVGs are **converted to outlines** — no font
dependency, they render identically everywhere.

- Wordmark: `ELA` steel + `RATER` amber, ~0.07em tracking, always two-tone.
- Utility labels: 500 weight, ~0.3em tracking, uppercase.

## Files

| File | Size | Where |
|---|---|---|
| `icon-512` | 512² | App icon, App Store / Play |
| `icon-180` | 180² | iOS home screen |
| `favicon` / `icon-32` / `icon-16` | 64² / 32² / 16² | Browser tab |
| `logo-lockup-dark` / `-light` | 1080×280 | Site header, decks, press |
| `og-1200x630` | 1200×630 | Link previews (X, LinkedIn, Slack, iMessage) |
| `social-square-1080` | 1080² | Instagram / LinkedIn feed |
| `social-story-1080x1920` | 1080×1920 | Stories, Reels, TikTok cover |

SVG = source of truth, edit these. PNG = ready to upload.

## Usage rules

1. The two-tone wordmark is load-bearing — `ELA` steel, `RATER` amber is what makes
   the elevator pun read. Never set the wordmark in one flat color.
2. Amber is the *lit* state. If it isn't scoring, indicating, or calling for action,
   it isn't amber.
3. Clear space around the lockup = the height of one lantern arrow.
4. Minimum lockup width 180px. Below that, use the icon alone.

## Social copy that ships with these

- Primary line: **Rate the ride.**
- Metric line: `CHIME · DWELL · JERK · LEVELING`
- Alt hooks: "Every car scored out of five." / "Your building's elevator is a 2.8
  and everyone knows it."

`jerk` is the real ride-quality metric (rate of change of acceleration). Keep it —
it's specific, it's true, and it's the line people screenshot.
