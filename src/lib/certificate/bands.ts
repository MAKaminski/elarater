/**
 * Score -> quality band. The band decides the score colour, the seal legend, and
 * whether the CONDEMNED variant renders — which docs/01-product-spec.md calls the
 * growth engine ("nobody screenshots a 4.5").
 */
import { bands, type BandLabel } from '@/theme/tokens';

export type { BandLabel };

/**
 * docs/03-erd.md: round((smooth+speedy+spotless+character)/4.0 * 2) / 2
 *
 * The rounding mode is load-bearing at the DEFICIENT/CONDEMNED boundary. Postgres
 * round() is half-away-from-zero and so is Math.round for positive values, so the
 * optimistic client score always matches the trigger:
 *
 *   1,2,1,1 -> 5/4 = 1.25 -> x2 = 2.5 -> round 3 -> /2 = 1.5 -> DEFICIENT
 *   1,1,1,2 -> 5/4 = 1.25 -> same. A CONDEMNED needs a genuine sub-1.5 mean.
 */
export function computeScore(sub: {
  smooth: number;
  speedy: number;
  spotless: number;
  character: number;
}): number {
  const mean = (sub.smooth + sub.speedy + sub.spotless + sub.character) / 4;
  return Math.round(mean * 2) / 2;
}

export function bandForScore(score: number): (typeof bands)[number] {
  const found = bands.find((b) => score >= b.min && score <= b.max);
  // Bands cover 0.0-5.0 contiguously; anything outside is a caller bug, so clamp loudly.
  return found ?? (score > 5 ? bands[0] : bands[bands.length - 1]);
}

export const labelForScore = (score: number): BandLabel => bandForScore(score).label;

/** Below 1.5 the certificate changes shape entirely. docs/05-certificate-spec.md. */
export const isCondemned = (score: number): boolean => labelForScore(score) === 'CONDEMNED';

/** Certificates always display one decimal, including whole numbers: "4.0", not "4". */
export const formatScore = (score: number): string => score.toFixed(1);
