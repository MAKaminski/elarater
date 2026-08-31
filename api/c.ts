/**
 * Certificate permalink. GET /c/ATL-004572
 *
 * Expo prerenders /c/[serial] exactly once, into a shell whose <head> still says
 * "[SERIAL]". That shell is what gets served, so link previews would unfurl as
 * "[SERIAL]" everywhere — and the whole growth loop is links
 * (docs/02-architecture.md).
 *
 * This function serves that same shell with the head rewritten for the requested
 * serial. Humans get the identical SPA and hydrate normally; scrapers get the real
 * title, description and OG image. One render path, no duplicated markup.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { OG, ogDescription, ogTitle, permalinkUrl, ogImageUrl } from '../src/lib/certificate/og';

const SHELL = join(__dirname, '../dist/server/c/[serial].html');

let shell: string | null = null;
function getShell(): string {
  if (shell === null) shell = readFileSync(SHELL, 'utf8');
  return shell;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (v: unknown, max: number, fallback = '—') =>
  (v && String(v).trim() ? String(v).trim().toUpperCase() : fallback).slice(0, max);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', `https://${req.headers.host ?? 'localhost'}`);
  const serial = (url.searchParams.get('serial') ?? url.pathname.split('/').pop() ?? '')
    .toUpperCase()
    .trim();

  let html: string;
  try {
    html = getShell();
  } catch {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain');
    res.end('Certificate shell is missing from the build output');
    return;
  }

  let title = `${serial} — ElaRater`;
  let description = `No inspection is on record for ${serial}.`;
  let status = 404;

  if (/^[A-Z]{2,4}-\d{6}$/.test(serial) && supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .rpc('certificate_by_serial', { p_serial: serial })
        .maybeSingle<Record<string, unknown>>();

      if (data) {
        const src = {
          serial,
          score: Number(data.score),
          band: String(data.band),
          manufacturer: clip([data.manufacturer, data.model].filter(Boolean).join(' '), 18, 'UNRECORDED'),
          location: clip(data.address_line, 28),
          remark1: data.remark_1 as string | null,
          remark2: data.remark_2 as string | null,
        };
        title = ogTitle(src);
        description = ogDescription(src);
        status = 200;
      }
    } catch {
      // A database hiccup must not take the page down — fall through to the shell
      // with generic metadata and let the client retry.
      status = 200;
    }
  }

  html = html
    .split(`/c/${OG.serial}`).join(`/c/${escapeAttr(serial)}`)
    .split(`/api/og/${OG.serial}`).join(`/api/og/${escapeAttr(serial)}`)
    .split(OG.title).join(escapeAttr(title))
    .split(OG.description).join(escapeAttr(description));

  res.statusCode = status;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
  res.end(html);
}
