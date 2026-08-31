/**
 * Link-preview metadata for a certificate.
 *
 * Shared by two consumers so their strings cannot drift:
 *   src/app/c/[serial].tsx   renders these into <head> for humans and hydration
 *   api/c.ts                 rewrites the prerendered shell with real values so
 *                            scrapers see the actual certificate
 *
 * Expo prerenders a dynamic route once, as a shell where the parameter is still the
 * literal route segment. That shell is what Vercel serves, so an unfixed permalink
 * would unfurl everywhere as "[SERIAL]". The sentinels below are what api/c.ts
 * substitutes.
 */
export const OG = {
  serial: '[SERIAL]',
  title: '[SERIAL] — ElaRater',
  description: 'An official finding of the Office of Ride Quality.',
} as const;

export type OgSource = {
  serial: string;
  score: number;
  band: string;
  manufacturer: string;
  location: string;
  remark1?: string | null;
  remark2?: string | null;
};

export function ogTitle(src: OgSource): string {
  return `${src.serial} — ${src.manufacturer} at ${src.location} — ElaRater`;
}

export function ogDescription(src: OgSource): string {
  const remarks = [src.remark1, src.remark2].filter(Boolean).join(' ');
  const finding = `Rated ${src.score.toFixed(1)} out of five — ${src.band.toLowerCase()}.`;
  return remarks ? `${finding} ${remarks}` : finding;
}

export function siteUrl(): string {
  return (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://elarater.vercel.app').replace(/\/$/, '');
}

export const permalinkUrl = (serial: string) => `${siteUrl()}/c/${serial.toUpperCase()}`;
export const ogImageUrl = (serial: string, size: 'og' | 'square' = 'og') =>
  `${siteUrl()}/api/og/${serial.toUpperCase()}?size=${size}`;
