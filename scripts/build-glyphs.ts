/**
 * Bakes glyph outlines into src/lib/certificate/glyphs.gen.ts.
 *
 * WHY THIS EXISTS
 * ---------------
 * brand/v3/_generator_build3.py builds the reference certificate by instancing the
 * Archivo variable font at wght=700 / wdth=88 and converting every string to outlined
 * paths with manual per-glyph advance and tracking. That is not reproducible with
 * react-native-svg's <Text>: native cannot select variable-font axes, and letterSpacing
 * rounds differently on iOS, Android and web.
 *
 * So we port the pipeline instead of the output. Every string on the certificate — and
 * every FormLabel in the app — is drawn from these baked outlines. Four render paths
 * (iOS, Android, web, the Vercel OG function) consume identical geometry, and the
 * emitted SVG contains zero <text> elements, so the server rasteriser needs no fonts.
 *
 * Paths are stored in font units with the Y axis ALREADY FLIPPED (font space is Y-up,
 * SVG is Y-down), so a render is `translate(x, baseline) scale(size / upem)`.
 *
 * Regenerate: npm run gen:glyphs
 */
import * as fontkit from 'fontkit';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const FONTS = join(ROOT, 'assets/fonts');
const OUT = join(ROOT, 'src/lib/certificate/glyphs.gen.ts');

/** Printable ASCII plus the middot used by the CONDEMNED footer. */
const CHARSET = [
  ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)),
  '·',
  '’',
];

type FaceSpec = {
  key: string;
  file: string;
  variation?: { wght: number; wdth: number };
  /** Restrict the baked charset when a face is only ever used for fixed strings. */
  charset?: string[];
  note: string;
};

/** The seal only ever renders uppercase, digits and spaces. */
const SEAL_CHARSET = [
  ' ',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  ...Array.from({ length: 10 }, (_, i) => String(i)),
];

/**
 * The four faces the certificate uses. `form` carries the wdth=88 instance because
 * docs/04-design-system.md makes the Archivo/Courier split the whole concept:
 * pre-printed form vs. typed-in-later.
 */
const FACES: FaceSpec[] = [
  {
    key: 'form',
    file: 'Archivo-Variable.ttf',
    variation: { wght: 700, wdth: 88 },
    note: 'Archivo instanced at wght 700 / wdth 88 — every tracked-caps form label',
  },
  {
    key: 'formWide',
    file: 'Archivo-Variable.ttf',
    variation: { wght: 700, wdth: 100 },
    charset: SEAL_CHARSET,
    note: 'Archivo at wght 700 / wdth 100 — the seal arcs and year, which the source generator draws at default width, unlike the labels',
  },
  {
    key: 'authority',
    file: 'AlfaSlabOne-Regular.ttf',
    note: 'Alfa Slab One — wordmark and score numerals only, never body copy',
  },
  {
    key: 'typed',
    file: 'CourierPrime-Bold.ttf',
    note: 'Courier Prime Bold — field values the inspector "typed"',
  },
  {
    key: 'typedRegular',
    file: 'CourierPrime-Regular.ttf',
    note: 'Courier Prime Regular — inspector remarks',
  },
];

/** fontkit path commands -> an SVG `d` in font units, Y flipped. */
function toFlippedPath(glyph: fontkit.Glyph): string {
  const n = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
  const out: string[] = [];
  for (const c of glyph.path.commands) {
    const a = c.args;
    switch (c.command) {
      case 'moveTo':
        out.push(`M${n(a[0])} ${n(-a[1])}`);
        break;
      case 'lineTo':
        out.push(`L${n(a[0])} ${n(-a[1])}`);
        break;
      case 'quadraticCurveTo':
        out.push(`Q${n(a[0])} ${n(-a[1])} ${n(a[2])} ${n(-a[3])}`);
        break;
      case 'bezierCurveTo':
        out.push(`C${n(a[0])} ${n(-a[1])} ${n(a[2])} ${n(-a[3])} ${n(a[4])} ${n(-a[5])}`);
        break;
      case 'closePath':
        out.push('Z');
        break;
    }
  }
  return out.join('');
}

type Face = {
  upem: number;
  glyphs: Record<string, { d: string; a: number }>;
};

const faces: Record<string, Face> = {};

for (const spec of FACES) {
  const loaded = fontkit.openSync(join(FONTS, spec.file));
  if ('fonts' in loaded) throw new Error(`${spec.file} is a font collection, expected a single font`);
  const f = spec.variation ? loaded.getVariation(spec.variation) : loaded;
  const glyphs: Face['glyphs'] = {};

  for (const ch of spec.charset ?? CHARSET) {
    const run = f.layout(ch);
    const g = run.glyphs[0];
    if (!g) continue;
    glyphs[ch] = { d: toFlippedPath(g), a: Math.round(g.advanceWidth * 100) / 100 };
  }

  faces[spec.key] = { upem: f.unitsPerEm, glyphs };
  const bytes = JSON.stringify(glyphs).length;
  console.log(
    `${spec.key.padEnd(13)} ${String(Object.keys(glyphs).length).padStart(3)} glyphs  ` +
      `${(bytes / 1024).toFixed(1)} KB  ${spec.note}`,
  );
}

const faceBlocks = FACES.map((spec) => {
  const face = faces[spec.key];
  const rows = Object.entries(face.glyphs)
    .map(([ch, g]) => `    ${JSON.stringify(ch)}: { d: ${JSON.stringify(g.d)}, a: ${g.a} },`)
    .join('\n');
  return `  /** ${spec.note} */\n  ${spec.key}: {\n    upem: ${face.upem},\n    glyphs: {\n${rows}\n    },\n  },`;
}).join('\n');

const out = `// GENERATED FILE — do not edit.
// Source: assets/fonts/*.ttf via scripts/build-glyphs.ts
// Regenerate: npm run gen:glyphs
//
// Outlines are in font units with the Y axis already flipped for SVG.
// Render a glyph as: translate(penX, baselineY) scale(size / upem).
/* eslint-disable */

export type Glyph = {
  /** SVG path data in font units, Y already flipped. */
  d: string;
  /** Advance width in font units. */
  a: number;
};

export type Face = {
  upem: number;
  glyphs: Record<string, Glyph>;
};

export const faces = {
${faceBlocks}
} as const satisfies Record<string, Face>;

export type FaceKey = keyof typeof faces;
`;

writeFileSync(OUT, out);
console.log('wrote ' + OUT + ' (' + (out.length / 1024).toFixed(0) + ' KB)');
