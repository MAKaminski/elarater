/**
 * Text as outlines. Ports text_path / text_svg from brand/v3/_generator_lib.py.
 *
 * Every glyph is placed individually from the baked table in glyphs.gen.ts, so the
 * result is identical on iOS, Android, web and the server rasteriser — and needs no
 * font loading anywhere. See scripts/build-glyphs.ts for why.
 */
import { faces, type FaceKey } from './glyphs.gen';
import { n2, type Node } from './scene';

export type Anchor = 'start' | 'middle' | 'end';

export type TextOptions = {
  face: FaceKey;
  size: number;
  /** Extra advance after each glyph, in rendered px. Trailing tracking is not counted. */
  tracking?: number;
  anchor?: Anchor;
  fill: string;
  opacity?: number;
};

/**
 * Advance width of `text` in rendered px.
 *
 * Mirrors _generator_lib.text_path: tracking is added after every glyph and the
 * trailing one is subtracted, so width = sum(advances) + tracking * (n - 1).
 * Characters with no glyph in the face advance 0.4em, exactly as the source does.
 */
export function measureText(text: string, face: FaceKey, size: number, tracking = 0): number {
  const f = faces[face];
  const scale = size / f.upem;
  let x = 0;
  for (const ch of text) {
    const g = (f.glyphs as Record<string, { d: string; a: number } | undefined>)[ch];
    x += g ? g.a * scale + tracking : size * 0.4 + tracking;
  }
  return text.length > 0 ? x - tracking : 0;
}

/**
 * Lay `text` out with its baseline at (x, y) and return one Path node per glyph.
 *
 * Outlines are baked in font units with Y already flipped, so each glyph is placed
 * with `translate(penX, baselineY) scale(size / upem)`.
 */
export function layoutText(text: string, x: number, y: number, o: TextOptions): Node[] {
  const { face, size, tracking = 0, anchor = 'start', fill, opacity } = o;
  const f = faces[face];
  const scale = size / f.upem;

  let penX = x;
  if (anchor !== 'start') {
    const w = measureText(text, face, size, tracking);
    penX -= anchor === 'middle' ? w / 2 : w;
  }

  const nodes: Node[] = [];
  for (const ch of text) {
    const g = (f.glyphs as Record<string, { d: string; a: number } | undefined>)[ch];
    if (!g) {
      penX += size * 0.4 + tracking;
      continue;
    }
    if (g.d) {
      nodes.push({
        t: 'path',
        d: g.d,
        transform: `translate(${n2(penX)},${n2(y)}) scale(${scale.toFixed(6)})`,
        fill,
        ...(opacity !== undefined ? { op: opacity } : {}),
      });
    }
    penX += g.a * scale + tracking;
  }
  return nodes;
}

/**
 * Place each glyph individually around a circle.
 *
 * Ports arc_text from _generator_build3.py. Bottom-arc glyphs are NOT flipped 180°
 * — they read upright along the curve. docs/05-certificate-spec.md calls getting this
 * wrong "the one real bug in the source generator", so it has its own test.
 */
export function layoutArcText(
  text: string,
  cx: number,
  cy: number,
  r: number,
  o: TextOptions & { bottom?: boolean },
): Node[] {
  const { face, size, tracking = 0, fill, bottom = false } = o;
  const f = faces[face];
  const scale = size / f.upem;

  const widths = [...text].map((ch) => {
    const g = (f.glyphs as Record<string, { d: string; a: number } | undefined>)[ch];
    return (g ? g.a * scale : size * 0.4) + tracking;
  });
  const total = widths.reduce((a, b) => a + b, 0);

  const nodes: Node[] = [];
  let run = 0;
  [...text].forEach((ch, i) => {
    const w = widths[i];
    const theta = (run + w / 2 - total / 2) / r;
    const deg = (theta * 180) / Math.PI;
    const g = (f.glyphs as Record<string, { d: string; a: number } | undefined>)[ch];
    run += w;
    if (!g || !g.d) return;

    const gw = g.a * scale;
    const transform = bottom
      ? `translate(${cx},${cy}) rotate(${(-deg).toFixed(2)}) translate(0,${r.toFixed(2)}) ` +
        `translate(${(-gw / 2).toFixed(2)},0) scale(${scale.toFixed(6)})`
      : `translate(${cx},${cy}) rotate(${deg.toFixed(2)}) ` +
        `translate(0,${(-(r - size * 0.74)).toFixed(2)}) ` +
        `translate(${(-gw / 2).toFixed(2)},0) scale(${scale.toFixed(6)})`;

    nodes.push({ t: 'path', d: g.d, transform, fill });
  });
  return nodes;
}
