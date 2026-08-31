import { describe, expect, it } from 'vitest';
import { layoutArcText, layoutText, measureText } from './text';

describe('outlined text layout', () => {
  it('measures tracking the way the source generator does', () => {
    // width = sum(advances) + tracking * (n - 1); trailing tracking is not counted.
    const plain = measureText('ABC', 'form', 20, 0);
    const tracked = measureText('ABC', 'form', 20, 5);
    expect(tracked - plain).toBeCloseTo(10, 5);
    expect(measureText('', 'form', 20, 5)).toBe(0);
  });

  it('anchors middle and end against the measured width', () => {
    const w = measureText('ABC', 'form', 20, 2);
    const start = layoutText('ABC', 100, 0, { face: 'form', size: 20, tracking: 2, fill: '#000' });
    const middle = layoutText('ABC', 100, 0, { face: 'form', size: 20, tracking: 2, fill: '#000', anchor: 'middle' });
    const first = (n: (typeof start)[number]) => (n.t === 'path' ? n.transform! : '');
    const x = (t: string) => Number(/translate\(([-\d.]+),/.exec(t)![1]);
    expect(x(first(middle[0]))).toBeCloseTo(x(first(start[0])) - w / 2, 1);
  });

  it('places bottom-arc glyphs upright, not mirrored', () => {
    // docs/05-certificate-spec.md calls a mirrored bottom arc "the one real bug in
    // the source generator", so this is pinned: bottom glyphs rotate by the NEGATED
    // angle and translate outward by +r, with no 180-degree flip anywhere.
    const bottom = layoutArcText('ABC', 100, 100, 50, { face: 'formWide', size: 12, fill: '#000', bottom: true });
    const top = layoutArcText('ABC', 100, 100, 50, { face: 'formWide', size: 12, fill: '#000' });

    const t0 = bottom[0].t === 'path' ? bottom[0].transform! : '';
    const u0 = top[0].t === 'path' ? top[0].transform! : '';
    expect(t0).not.toContain('rotate(180');
    expect(u0).not.toContain('rotate(180');

    const bottomAngle = Number(/rotate\(([-\d.]+)\)/.exec(t0)![1]);
    const topAngle = Number(/rotate\(([-\d.]+)\)/.exec(u0)![1]);
    expect(bottomAngle).toBeCloseTo(-topAngle, 4);

    // Bottom baseline sits at +r; top sits at -(r - size * 0.74).
    expect(t0).toContain('translate(0,50.00)');
    expect(u0).toContain('translate(0,-41.12)');
  });

  it('advances 0.4em for characters with no glyph, as the source does', () => {
    const w = measureText('中', 'form', 20, 0);
    expect(w).toBeCloseTo(8, 5);
  });
});
