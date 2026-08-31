import { describe, expect, it } from 'vitest';
import { computeScore, labelForScore, isCondemned, formatScore } from './bands';

describe('score derivation', () => {
  it('rounds to half points', () => {
    expect(computeScore({ smooth: 5, speedy: 4, spotless: 4, character: 5 })).toBe(4.5);
    expect(computeScore({ smooth: 5, speedy: 5, spotless: 5, character: 5 })).toBe(5);
    expect(computeScore({ smooth: 1, speedy: 1, spotless: 1, character: 1 })).toBe(1);
  });

  it('matches Postgres rounding at the CONDEMNED boundary', () => {
    // 5/4 = 1.25 -> x2 = 2.5 -> round half-away-from-zero = 3 -> /2 = 1.5
    // Both Postgres round() and Math.round agree, so the optimistic client score
    // always matches what the trigger writes. A CONDEMNED needs a real sub-1.5 mean.
    const score = computeScore({ smooth: 1, speedy: 2, spotless: 1, character: 1 });
    expect(score).toBe(1.5);
    expect(labelForScore(score)).toBe('DEFICIENT');
    expect(isCondemned(score)).toBe(false);

    const worse = computeScore({ smooth: 1, speedy: 1, spotless: 1, character: 2 });
    expect(worse).toBe(1.5);
  });

  it('maps every band boundary', () => {
    const cases: [number, string][] = [
      [5.0, 'EXCELLENT'],
      [4.5, 'EXCELLENT'],
      [4.4, 'SATISFACTORY'],
      [3.5, 'SATISFACTORY'],
      [3.4, 'ACCEPTABLE'],
      [2.5, 'ACCEPTABLE'],
      [2.4, 'DEFICIENT'],
      [1.5, 'DEFICIENT'],
      [1.4, 'CONDEMNED'],
      [0.0, 'CONDEMNED'],
    ];
    for (const [score, band] of cases) expect(labelForScore(score)).toBe(band);
  });

  it('always shows one decimal, including whole numbers', () => {
    expect(formatScore(4)).toBe('4.0');
    expect(formatScore(4.5)).toBe('4.5');
  });
});
