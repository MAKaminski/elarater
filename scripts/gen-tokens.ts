/**
 * brand/tokens/design-tokens.json  ->  src/theme/tokens.ts
 *
 * The design system has exactly one source of truth. A literal hex in a component
 * is a bug (docs/07-scaffold-plan.md, "Guarding against drift").
 * Run with: npm run gen:tokens
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'brand/tokens/design-tokens.json');
const OUT = join(ROOT, 'src/theme/tokens.ts');

type TokenValue = { value: string; use?: string };
type Band = {
  min: number;
  max: number;
  label: string;
  scoreColor: string;
  sealColor: string;
};
type TypeStyle = {
  font: 'authority' | 'form' | 'typed';
  size: number;
  weight: number;
  tracking: number;
  case?: 'upper';
};

type Tokens = {
  meta: Record<string, string>;
  color: Record<string, TokenValue>;
  font: Record<string, { value: string }>;
  type: Record<string, TypeStyle>;
  space: Record<string, number>;
  radius: Record<string, number>;
  border: Record<string, number>;
  certificate: {
    canvas: { width: number; height: number };
    bands: Band[];
    fields: { key: string; label: string | null; maxChars?: number }[];
  };
};

const t = JSON.parse(readFileSync(SRC, 'utf8')) as Tokens;

const q = (s: string) => JSON.stringify(s);
const entries = (o: Record<string, number>) =>
  Object.entries(o)
    .map(([k, v]) => `  ${k}: ${v},`)
    .join('\n');

const colors = Object.entries(t.color)
  .map(([k, v]) => `  /** ${v.use} */\n  ${k}: ${q(v.value)},`)
  .join('\n');

const typeStyles = Object.entries(t.type)
  .map(
    ([k, v]) =>
      `  ${k}: { font: ${q(v.font)}, size: ${v.size}, weight: ${v.weight}, ` +
      `tracking: ${v.tracking}${v.case ? `, case: ${q(v.case)}` : ''} },`,
  )
  .join('\n');

const bands = t.certificate.bands
  .map(
    (b) =>
      `  { min: ${b.min}, max: ${b.max}, label: ${q(b.label)}, ` +
      `scoreColor: ${q(b.scoreColor)}, sealColor: ${q(b.sealColor)} },`,
  )
  .join('\n');

const fieldLimits = t.certificate.fields
  .filter((f) => typeof f.maxChars === 'number')
  .map((f) => `  ${f.key}: ${f.maxChars},`)
  .join('\n');

const out = `// GENERATED FILE — do not edit.
// Source: brand/tokens/design-tokens.json (${t.meta.brand} ${t.meta.version})
// Regenerate: npm run gen:tokens

export const color = {
${colors}
} as const;

export type ColorToken = keyof typeof color;

/**
 * Font families as registered with expo-font in src/app/_layout.tsx.
 *
 * Archivo ships as a VARIABLE font (wght 100-900, wdth 62-125) whose default
 * instance is SemiBold 600. Consequences, deliberately chosen:
 *
 *   - Tracked-caps form labels are brand-critical and must be wght 700 / wdth 88.
 *     Native cannot select variable axes, so FormLabel renders baked glyph outlines
 *     instead of live text (src/lib/certificate/glyphs.gen.ts). Identical on all
 *     three targets, and identical to the certificate.
 *   - Web resolves "fontWeight" against the variable font correctly, so incidental
 *     UI prose is real selectable text there.
 *   - Native renders incidental UI prose at the 600 default. Accepted: the design
 *     system keeps Archivo prose to labels and short headlines.
 */
export const font = {
  authority: 'AlfaSlabOne',
  form: 'Archivo',
  typed: 'CourierPrime',
  typedBold: 'CourierPrime-Bold',
} as const;

export type FontRole = 'authority' | 'form' | 'typed';

export const type = {
${typeStyles}
} as const;

export const space = {
${entries(t.space)}
} as const;

export const radius = {
${entries(t.radius)}
} as const;

export const border = {
${entries(t.border)}
} as const;

export const canvas = {
  width: ${t.certificate.canvas.width},
  height: ${t.certificate.canvas.height},
} as const;

export type BandLabel =
${t.certificate.bands.map((b) => `  | ${q(b.label)}`).join('\n')};

export const bands = [
${bands}
] as const;

/** Hard limits. 49 characters overruns the certificate field and breaks the layout. */
export const fieldLimits = {
${fieldLimits}
} as const;
`;

writeFileSync(OUT, out);
console.log('wrote ' + OUT);
