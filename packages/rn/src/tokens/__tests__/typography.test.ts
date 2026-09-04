import { semanticDark, semanticLight } from '../semantic';
import type { SemanticTokens, TypeStyle } from '../types';

/**
 * The type scale carries two React Native constraints that are invisible
 * on the web and expensive to discover on a device. Both are asserted
 * here so a future edit cannot quietly reintroduce them.
 */
describe.each([
  ['light', semanticLight],
  ['dark', semanticDark],
])('%s theme typography', (_mode, t: SemanticTokens) => {
  const entries = Object.entries(t.typography) as Array<[string, TypeStyle]>;

  it.each(entries)('%s uses a weight that exists on both platforms', (_n, style) => {
    // Roboto has no 600. A '600' token renders semibold on iOS and
    // something else on Android: one token, two appearances.
    expect(['400', '500', '700']).toContain(style.fontWeight);
  });

  it.each(entries)(
    '%s states line height as a ratio, not a pixel value',
    (_n, style) => {
      // A ratio lives between roughly 1.1 and 1.7. Anything at or above 2
      // is somebody having written an absolute pixel height, which breaks
      // the moment the reader enlarges the system text size.
      expect(style.lineHeight).toBeGreaterThan(1);
      expect(style.lineHeight).toBeLessThan(2);
    },
  );

  it.each(entries)('%s resolves to a legible line height', (_n, style) => {
    const resolved = style.fontSize * style.lineHeight;
    expect(resolved).toBeGreaterThanOrEqual(style.fontSize + 4);
  });

  it('leaves reading text uncapped', () => {
    // Capping body text caps the reader. The accessibility setting exists
    // for them, not for our layouts.
    expect(t.typography.body.maxFontSizeMultiplier).toBeUndefined();
    expect(t.typography.bodySmall.maxFontSizeMultiplier).toBeUndefined();
  });

  it('caps the roles that live inside fixed controls', () => {
    for (const role of ['label', 'caption', 'mono'] as const) {
      expect(t.typography[role].maxFontSizeMultiplier).toBeDefined();
    }
  });

  it('steps down in size without collisions', () => {
    const ordered = [
      'display',
      'title',
      'subtitle',
      'body',
      'bodySmall',
      'caption',
    ] as const;
    const sizes = ordered.map((k) => t.typography[k].fontSize);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(new Set(sizes).size).toBe(sizes.length);
  });
});
