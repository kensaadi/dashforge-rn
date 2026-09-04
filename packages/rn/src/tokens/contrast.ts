/**
 * Contrast maths, in the token layer because the semantic tier needs it
 * to choose which step of a ramp can carry a label.
 *
 * Pure and platform-free, like everything else here.
 */

/** WCAG relative luminance of a `#rrggbb` colour. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channel = (i: number) => {
    const c = parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The tone deltas the palette is built on, kept here so a test can name
 * the rule it is checking rather than repeating a magic number.
 *
 * From Material 3: a tone difference of 40 buys 3:1, of 50 buys 4.5:1.
 * Verified against the shipped ramps in `contrast.test.ts`.
 */
export const TONE_DELTA = {
  /** Enough for large text and for non-text UI boundaries. */
  ui: 40,
  /** Enough for body text. */
  text: 50,
} as const;
