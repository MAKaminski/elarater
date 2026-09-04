# 0004 — A QR code is part of the certificate's fixed chrome

- **Date:** 2026-09-04
- **Status:** Accepted
- **Amends:** `CLAUDE.md` rule 2 — "Nine variables change per certificate … Everything
  else is fixed chrome."

## Context

The certificate's whole conceit is that it is a physical artifact: a framed document
posted inside an elevator car, the parody of the real one hanging beside it. The specs
build the digital object faithfully and then stop at the boundary of the screen.

But the artifact's most valuable moment is the one the specs did not model — somebody
standing in the car, looking at a printed copy, with no way to reach the live finding.
`docs/01-product-spec.md` names the growth loop as sharing, and `docs/02-architecture.md`
says "the whole growth loop is links". A printed certificate carried no link at all.

## Decision

Every certificate with an issued serial renders a QR encoding its permalink, in the
empty block between the finding and the seal — measured at 179 × 116 px, so a 104 px
code clears both. Labelled "SCAN TO VERIFY", which is what the equivalent block says on
a real inspection document.

It is emitted as scene-graph rects from `lib/certificate/qr.ts`, not as an image. A QR
is a grid of squares and the scene graph already draws squares, so all four render
paths get it at once — react-native-svg on iOS, Android and web, plus the SVG string
the Vercel OG function rasterises.

## Consequences

- The share image, the OG unfurl, the in-app view and any printed copy all carry the
  link, from one change. Nothing is stored: existing certificates gain the code the
  next time they render, because they render from geometry.
- `qrcode-generator` is dependency-free and runs unchanged in Hermes, the browser and
  Node — which is why it was chosen over `qrcode` (three deps) and
  `react-native-qrcode-svg` (native-only, and it wraps `qrcode` anyway).
- The quiet zone is filled with `stock`, not white. It has to be opaque or a scanner
  reads the guilloche as data, but a white patch on manila breaks the illusion the
  design rests on. Ink on stock is 12.6:1, far past what a decoder needs.
- Error correction stays at 'M'. Padding to 'Q' or 'H' would raise the module count and
  shrink each module below what a phone camera resolves at arm's length in a lift.
- **Verification is a decode, not a pixel diff.** `npm run verify:certificate`
  rasterises the certificate at 900×662 and again at the OG's 1200×630, then reads the
  code back with a real decoder. A QR that renders but does not scan is the failure
  mode that matters, and a pixel comparison would never catch it.
- `brand/v3/certificate-hero.svg` predates the code, so the parity check runs with the
  permalink omitted and still holds at 0.005%. `permalink` being optional is what makes
  that possible, and it is also correct on its own terms: a rating whose serial has not
  been issued yet has nothing to link to.

## Rejected

- **A QR in the corner margin.** Cleaner typographically, but the margins are where the
  brass frame and screws land in the share export, which would cover it.
- **Encoding the serial rather than a URL.** Scanning would yield "ATL-004572" and a
  confused user. The point is to arrive somewhere.
