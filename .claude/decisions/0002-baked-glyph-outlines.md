# 0002 — Draw certificate text as baked glyph outlines, not `<Text>`

- **Date:** 2026-08-31
- **Status:** Accepted

## Context

`brand/v3/_generator_build3.py` builds the reference certificate by instancing the
Archivo **variable** font at `wght=700, wdth=88` and converting every string to
outlined paths with manual per-glyph advance and tracking.

Phase 2 must be "visually identical to `brand/v3/certificate-hero.svg`" across four
render paths: iOS, Android, web, and the server rasteriser.

`react-native-svg`'s `<Text>` cannot reproduce this. Native cannot select variable-font
axes at all — Archivo's default instance is SemiBold 600, not the required 700/88 —
and `letterSpacing` rounds differently on each platform.

## Decision

Port the *pipeline* rather than the output. `scripts/build-glyphs.ts` uses fontkit to
instance each face and bake its glyph outlines into `src/lib/certificate/glyphs.gen.ts`
(font units, Y pre-flipped). `text.ts` places each glyph individually.

Five faces are baked: Archivo 700/88 (form labels), Archivo 700/100 (the seal arcs and
year — the source generator draws these at default width, unlike the labels), Alfa Slab
One, and Courier Prime in both weights.

`FormLabel` uses the same path, so tracked caps in the app chrome are identical to the
certificate on every target.

## Consequences

- Verified at **0.005%** pixel difference against the reference (32 px of 595,800).
- The emitted SVG contains **zero `<text>` elements**, so the server rasteriser needs
  no fonts at all. This is what makes `@resvg/resvg-wasm` viable and removes any
  font-loading failure mode from the OG path.
- The seal's arc text becomes a unit-testable transform. `docs/05-certificate-spec.md`
  calls a mirrored bottom arc "the one real bug in the source generator", and there is
  now a test pinning the orientation.
- **Cost:** ~195 KB of generated path data in the bundle, and remarks are restricted to
  the baked charset. That restriction is enforced in Zod and by `moderate-remarks`, so
  an unrenderable character is refused rather than silently drawn as a blank advance.
- Archivo is still bundled for incidental UI prose, where it renders at its 600 default
  on native. Accepted: the design system keeps Archivo prose to labels and short
  headlines, and web resolves `fontWeight` against the variable font correctly.
