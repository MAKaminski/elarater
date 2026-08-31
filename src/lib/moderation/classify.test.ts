import { describe, expect, it } from 'vitest';
import { classify } from './classify';

describe('remark moderation', () => {
  it('approves ordinary remarks', () => {
    expect(classify(['Rides like butter. Doors close like they are']).status).toBe('approved');
    expect(classify([null, undefined]).status).toBe('approved');
    expect(classify(['']).status).toBe('approved');
  });

  it('rejects contact details and links, which are the spam vector', () => {
    expect(classify(['Call me on 404 555 0199']).reason).toBe('spam_or_contact');
    expect(classify(['Visit https://example.com']).reason).toBe('spam_or_contact');
    expect(classify(['reach me at spam@example.com']).reason).toBe('spam_or_contact');
    expect(classify(['best crypto tips here']).reason).toBe('spam_or_contact');
  });

  it('rejects characters the certificate cannot draw', () => {
    // The renderer uses a baked Latin-1 glyph table; anything else would silently
    // render as a blank advance, which is worse than refusing it.
    expect(classify(['Great ride 🎉']).reason).toBe('unsupported_characters');
    expect(classify(['エレベーター']).reason).toBe('unsupported_characters');
  });

  it('escalates shouting to a human rather than deciding', () => {
    const v = classify(['THIS ELEVATOR IS AN ABSOLUTE DISGRACE']);
    expect(v.status).toBe('pending');
    expect(v.reason).toBe('all_caps_review');
  });

  it('does not flag short uppercase fragments', () => {
    expect(classify(['OTIS GEN2, fine.']).status).toBe('approved');
  });

  it('rejects slurs regardless of substitution', () => {
    expect(classify(['what a r3tard']).reason).toBe('objectionable');
  });
});
