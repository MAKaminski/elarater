import { describe, expect, it } from 'vitest';
import { qrModuleCount, qrNodes } from './qr';

const URL = 'https://elarater.vercel.app/c/ATL-000007';

describe('certificate QR', () => {
  it('stays coarse enough to scan at 104px on paper', () => {
    // 104px across a 4-module quiet zone each side. Version 3 (29 modules) gives
    // 104 / 37 = 2.8px per module; much finer and a phone camera stops resolving it
    // at arm's length in an elevator.
    const modules = qrModuleCount(URL);
    expect(modules).toBeLessThanOrEqual(33);
    const px = 104 / (modules + 8);
    expect(px).toBeGreaterThan(2);
  });

  it('paints an opaque quiet zone in paper stock, masking the guilloche without a white patch', () => {
    const nodes = qrNodes(URL, { x: 476, y: 424, size: 104, fill: '#1E1C17', backdrop: '#EFE9D8' });
    const backdrop = nodes[0];
    expect(backdrop.t).toBe('rect');
    if (backdrop.t !== 'rect') throw new Error('expected a backdrop rect');
    expect(backdrop.x).toBe(476);
    expect(backdrop.w).toBe(104);
    expect(backdrop.fill).toBe('#EFE9D8');
  });

  it('keeps every module inside the declared box', () => {
    const nodes = qrNodes(URL, { x: 476, y: 424, size: 104, fill: '#1E1C17', backdrop: '#EFE9D8' });
    for (const n of nodes) {
      if (n.t !== 'rect') continue;
      expect(n.x).toBeGreaterThanOrEqual(476);
      expect(n.y).toBeGreaterThanOrEqual(424);
      expect(n.x + n.w).toBeLessThanOrEqual(476 + 104 + 0.01);
      expect(n.y + n.h).toBeLessThanOrEqual(424 + 104 + 0.01);
    }
  });

  it('merges horizontal runs rather than emitting one rect per module', () => {
    const nodes = qrNodes(URL, { x: 0, y: 0, size: 104, fill: '#1E1C17', backdrop: '#EFE9D8' });
    const modules = qrModuleCount(URL);
    // Worst case is one rect per dark module; run-merging should beat that clearly.
    expect(nodes.length).toBeLessThan((modules * modules) / 2);
  });
});
