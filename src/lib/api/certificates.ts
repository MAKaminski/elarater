/**
 * Certificate reads. The permalink is the sharing surface, so this module is the one
 * the marketing routes and the OG renderer both depend on.
 */
import { getSupabase } from '../supabase';
import { visibleRatingSchema, type VisibleRating } from '../schemas/rating';
import type { CertificateProps } from '../certificate/geometry';

/** Nothing else in the app may read public.ratings directly. */
export async function getCertificateBySerial(serial: string): Promise<VisibleRating | null> {
  const { data, error } = await getSupabase()
    .rpc('certificate_by_serial', { p_serial: serial })
    .maybeSingle();

  if (error) throw new Error(`certificate_by_serial(${serial}): ${error.message}`);
  if (!data) return null;
  return visibleRatingSchema.parse(data);
}

const FALLBACK = '—';

/**
 * A visible_ratings row -> the nine certificate variables.
 *
 * Every field is upper-cased and truncated to its documented limit here rather than in
 * the renderer: the certificate never reflows, so an overlong value would overrun its
 * field instead of wrapping (docs/05-certificate-spec.md).
 */
export function toCertificateProps(row: VisibleRating): CertificateProps {
  const clip = (v: string | null | undefined, max: number, fallback = FALLBACK) =>
    (v && v.trim() ? v.trim().toUpperCase() : fallback).slice(0, max);

  const maker = [row.manufacturer, row.model].filter(Boolean).join(' ');

  return {
    location: clip(row.address_line, 28),
    serial: row.serial ?? 'PENDING',
    manufacturer: clip(maker, 18, 'UNRECORDED'),
    capacity: clip(row.capacity_lb ? `${row.capacity_lb} LB` : null, 11),
    floors: clip(row.floors_served ? String(row.floors_served) : null, 12),
    score: row.score,
    remark1: row.remark_1 ?? undefined,
    remark2: row.remark_2 ?? undefined,
    inspectedOn: row.inspected_on.slice(0, 10),
  };
}

/** Absolute permalink. Used for share sheets and OG tags. */
export function certificateUrl(serial: string): string {
  const base = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://elarater.vercel.app';
  return `${base.replace(/\/$/, '')}/c/${serial.toUpperCase()}`;
}

export function certificateImageUrl(serial: string, size: 'square' | 'og' = 'og'): string {
  const base = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://elarater.vercel.app';
  return `${base.replace(/\/$/, '')}/api/og/${serial.toUpperCase()}?size=${size}`;
}
