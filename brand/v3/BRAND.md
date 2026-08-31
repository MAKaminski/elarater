# ElaRater — v3 "Office of Ride Quality"

Every elevator in America carries a framed inspection certificate behind
plexiglass. Nobody reads it. Everybody has looked at it. That document is the
whole identity now: ElaRater is the issuing authority, the rating is the official
finding, and every post is a certificate for one specific elevator.

## Why this one and not v1 or v2

v1 and v2 were brand systems. This is a **format**. The difference matters for
social: a brand system gives you a look to apply, a format gives you a thing
people want to fill in. Every elevator anyone rides generates a post, the layout
never changes, and the joke is carried by two typed fields — the remarks line and
the score. That's the engagement mechanic.

It also gives the product a native artifact. The in-app rating screen *is* the
certificate. Share button exports it at 1080². No separate marketing design.

## Palette

| Token | Hex | Use |
|---|---|---|
| Card Stock | `#EFE9D8` | Certificate paper |
| Security Tint | `#B9CCB6` | Guilloche wave pattern, ~50% opacity |
| Typewriter Ink | `#1E1C17` | Typed field values |
| Official Teal | `#0E6B62` | Authority ink — score, title, signature |
| Stamp Oxblood | `#B0342C` | Seal, serial number, "VOID IF REMOVED" |
| Brass | `#B08A3C` | Border rule, frame, screws |
| Fade | `#7A7565` | Form labels, small print |
| Car Wall | `#17332F` | Background — the elevator interior |

## Type

- **Alfa Slab One** — the authority wordmark. Fat Clarendon, official-notice energy.
- **Archivo** (condensed, 700) — form labels in tracked caps.
- **Courier Prime** — everything the inspector typed in. Regular for remarks, bold
  for field values.

All outlined in the SVGs. No font dependency.

## Files

| File | Size | Where |
|---|---|---|
| `certificate-hero` | 900×662 | The master document — this is the template |
| `icon-512` / `icon-180` | 512², 180² | App icon: the rubber stamp alone |
| `favicon` / `icon-32` / `icon-16` | 64², 32², 16² | Oxblood field, stamp reversed out |
| `logo-lockup-light` / `-dark` | 1080×280 | Header, decks, press |
| `og-1200x630` | 1200×630 | Link previews |
| `social-square-1080` | 1080² | Instagram / LinkedIn feed |
| `social-story-1080x1920` | 1080×1920 | Stories, Reels, TikTok |

## The template — what changes per elevator

Nine variables. Everything else is fixed:

`LOCATION` · `SERIAL NUMBER` · `MANUFACTURER / MODEL` · `RATED CAPACITY` ·
`FLOORS SERVED` · `SCORE` · `RIDE QUALITY` band · `INSPECTOR'S REMARKS` (2 lines,
~48 characters each) · `INSPECTED` date

Ride quality bands: 4.5–5.0 EXCELLENT · 3.5–4.4 SATISFACTORY · 2.5–3.4
ACCEPTABLE · 1.5–2.4 DEFICIENT · below 1.5 CONDEMNED.

CONDEMNED should flip the seal and score to oxblood. That's the version that
actually goes viral — nobody screenshots a good elevator.

## Voice

Bureaucratic deadpan on the outside, honest on the inside. The form is
straight-faced; the remarks line is where the personality lives.

- "Rides like butter. Doors close like they are mad at you."
- "Plays smooth jazz, inexplicably. No one has ever complained."
- "Arrives eventually. Inspector aged visibly during the wait."
- "Floor 13 is not offered. No explanation was provided."

Keep remarks under 48 characters per line or they overrun the field.

## Rules

1. The form never bends. Fields stay put, rules stay put, the seal always lands
   crooked in the same corner. The format's authority comes from repetition.
2. Oxblood is the stamp color. It appears on the seal, the serial number, and the
   VOID line. Nowhere else.
3. "VOID IF REMOVED FROM CAR" stays on every certificate. It's the tell that sells
   the whole conceit.
4. The certificate always appears framed and screwed to a wall in social exports —
   never floating on white. The frame is what makes it read as real.
