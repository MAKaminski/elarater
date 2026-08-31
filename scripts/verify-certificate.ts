/**
 * Phase 2 acceptance test.
 *
 * docs/07-scaffold-plan.md: "<Certificate {...sample} /> is visually identical to
 * brand/v3/certificate-hero.svg at 900x662".
 *
 * Rasterises both the reference and our port at 900x662 and pixel-diffs them. The
 * reference was produced by brand/v3/_generator_build3.py with these exact defaults,
 * so any drift is ours.
 *
 * Run: npm run verify:certificate
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { certificateSvg, framedCertificateSvg } from '../src/lib/certificate/to-svg-string';
import { CW, CH, type CertificateProps } from '../src/lib/certificate/geometry';

const ROOT = join(import.meta.dirname, '..');
const REFERENCE = join(ROOT, 'brand/v3/certificate-hero.svg');
const OUTDIR = join(ROOT, '.artifacts/certificate');

/** The exact defaults baked into certificate() in _generator_build3.py. */
const SAMPLE: CertificateProps = {
  score: 4.5,
  location: '1180 PEACHTREE ST NE',
  serial: 'ATL-004572',
  manufacturer: 'OTIS GEN2',
  capacity: '2500 LB',
  floors: '14',
  remark1: 'Rides like butter. Doors close like they are',
  remark2: 'mad at you. Plays smooth jazz, inexplicably.',
  inspectedOn: '2026-08-29',
};

/** Accept sub-pixel antialiasing drift, reject anything structural. */
const THRESHOLD_PCT = 0.5;

function raster(svg: string): PNG {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: CW } });
  return PNG.sync.read(r.render().asPng());
}

mkdirSync(OUTDIR, { recursive: true });

const ours = certificateSvg(SAMPLE);
writeFileSync(join(OUTDIR, 'ours.svg'), ours);

const a = raster(readFileSync(REFERENCE, 'utf8'));
const b = raster(ours);

if (a.width !== b.width || a.height !== b.height) {
  console.error(`size mismatch: reference ${a.width}x${a.height}, ours ${b.width}x${b.height}`);
  process.exit(1);
}

const diff = new PNG({ width: a.width, height: a.height });
const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });

writeFileSync(join(OUTDIR, 'reference.png'), PNG.sync.write(a));
writeFileSync(join(OUTDIR, 'ours.png'), PNG.sync.write(b));
writeFileSync(join(OUTDIR, 'diff.png'), PNG.sync.write(diff));

const total = a.width * a.height;
const pct = (changed / total) * 100;
console.log(`canvas    ${a.width}x${a.height} (${total.toLocaleString()} px)`);
console.log(`differing ${changed.toLocaleString()} px = ${pct.toFixed(3)}%`);
console.log(`artifacts ${OUTDIR}`);

if (pct > THRESHOLD_PCT) {
  console.error(`\nFAIL — ${pct.toFixed(3)}% differs, threshold is ${THRESHOLD_PCT}%`);
  process.exit(1);
}
console.log(`\nPASS — within ${THRESHOLD_PCT}%`);

// --------------------------------------------------------- variants (no reference)
// The CONDEMNED variant and the framed export postdate certificate-hero.svg, so they
// are built to docs/05-certificate-spec.md and inspected rather than diffed.

const CONDEMNED: CertificateProps = {
  score: 1.0,
  location: '400 W PEACHTREE ST',
  serial: 'ATL-004573',
  manufacturer: 'DOVER FREIGHT',
  capacity: '4000 LB',
  floors: 'B2-9',
  remark1: 'Screams on the way up. Screams on the way',
  remark2: 'down. Something is loose. Everything is.',
  inspectedOn: '2026-08-31',
};

for (const [name, svg] of [
  ['condemned.png', certificateSvg(CONDEMNED)],
  ['share-1080.png', framedCertificateSvg(SAMPLE, { width: 1080, height: 1080 })],
  ['share-condemned-1080.png', framedCertificateSvg(CONDEMNED, { width: 1080, height: 1080 })],
  ['og-1200x630.png', framedCertificateSvg(SAMPLE, { width: 1200, height: 630 })],
] as const) {
  const png = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
  writeFileSync(join(OUTDIR, name), png);
  console.log('wrote ' + name);
}
