/**
 * Certificate OG image. GET /api/og/ATL-004572?size=og|square
 *
 * A plain Vercel Function rather than an Expo Router API route, deliberately: it is
 * built by @vercel/node directly, so nothing about Metro's bundling has to be true for
 * the rasteriser to work.
 *
 * It imports lib/certificate/geometry.ts — the SAME file the react-native-svg
 * component uses. docs/05-certificate-spec.md: "Do not maintain two copies of the
 * coordinates."
 *
 * Because every glyph on the certificate is already an outline, the SVG contains zero
 * <text> elements and resvg needs no fonts at all.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { framedCertificateSvg } from '../src/lib/certificate/to-svg-string';
import type { CertificateProps } from '../src/lib/certificate/geometry';

const SIZES = {
  og: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
} as const;

let wasmReady: Promise<void> | null = null;
function ensureWasm() {
  if (!wasmReady) {
    wasmReady = initWasm(readFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm')));
  }
  return wasmReady;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

/** Prefer the request's own host so preview deployments link to themselves. */
function siteBase(req: IncomingMessage): string {
  const envBase = process.env.EXPO_PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const host = req.headers.host ?? 'elarater.vercel.app';
  return `https://${host}`;
}

const FALLBACK = '—';
const clip = (v: string | null | undefined, max: number, fallback = FALLBACK) =>
  (v && String(v).trim() ? String(v).trim().toUpperCase() : fallback).slice(0, max);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', `https://${req.headers.host ?? 'localhost'}`);
  const serial = (url.searchParams.get('serial') ?? url.pathname.split('/').pop() ?? '')
    .toUpperCase()
    .trim();
  const size = SIZES[url.searchParams.get('size') === 'square' ? 'square' : 'og'];

  if (!/^[A-Z]{2,4}-\d{6}$/.test(serial)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'text/plain');
    res.end('Expected a serial like ATL-004572');
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain');
    res.end('Supabase environment is not configured');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .rpc('certificate_by_serial', { p_serial: serial })
      .maybeSingle<Record<string, unknown>>();

    if (error) throw new Error(error.message);
    if (!data) {
      res.statusCode = 404;
      res.setHeader('content-type', 'text/plain');
      res.end(`No certificate on record for ${serial}`);
      return;
    }

    const maker = [data.manufacturer, data.model].filter(Boolean).join(' ');
    const props: CertificateProps = {
      // The OG image is the copy most likely to be screenshotted and posted, so it
      // carries the QR back to the live certificate.
      permalink: `${siteBase(req)}/c/${serial}`,
      location: clip(data.address_line as string, 28),
      serial,
      manufacturer: clip(maker, 18, 'UNRECORDED'),
      capacity: clip(data.capacity_lb ? `${data.capacity_lb} LB` : null, 11),
      floors: clip(data.floors_served ? String(data.floors_served) : null, 12),
      score: Number(data.score),
      remark1: (data.remark_1 as string) ?? undefined,
      remark2: (data.remark_2 as string) ?? undefined,
      inspectedOn: String(data.inspected_on).slice(0, 10),
    };

    await ensureWasm();
    const svg = framedCertificateSvg(props, size);
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size.width } })
      .render()
      .asPng();

    res.statusCode = 200;
    res.setHeader('content-type', 'image/png');
    // A certificate is immutable once issued, so this can cache hard. Scrapers hit
    // this endpoint repeatedly and rasterising is the expensive part.
    res.setHeader('cache-control', 'public, max-age=3600, s-maxage=86400, immutable');
    res.end(Buffer.from(png));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain');
    res.end(`Could not render ${serial}: ${(err as Error).message}`);
  }
}
