/**
 * CIE Lab / LCh conversion, and the ramp generator built on it.
 *
 * Here rather than in a build script because a consumer needs it: a
 * palette handed to us as raw hex is only as good as whoever generated
 * it, and the tools designers actually use (Figma's picker, most online
 * scale generators) work in HSL or HSB. Those are not perceptual, so a
 * ramp built with them has a different real lightness at every hue and
 * the contract in `palette.ts` does not hold.
 *
 * Give this a single brand colour instead and the ramp comes out on the
 * right tones by construction.
 */
import type { ColorRamp } from './palette';

const D65 = [95.047, 100.0, 108.883] as const;
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/** Hue angle and chroma of a colour, plus its CIE L\* tone. */
export interface Lch {
  /** CIE L\*, 0 to 100. The axis every ramp step is anchored to. */
  L: number;
  /** Chroma. Roughly "how much colour", unbounded but ~130 in practice. */
  C: number;
  /** Hue angle in degrees. */
  H: number;
}

/** Read a `#rrggbb` colour as tone, chroma and hue. */
export function hexToLch(hex: string): Lch {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 1, 2].map((i) =>
    toLinear(parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255),
  );
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  const Y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X / D65[0]), f(Y / D65[1]), f(Z / D65[2])];
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return {
    L,
    C: Math.hypot(a, bb),
    H: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

function lchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const X = (inv(fx) * D65[0]) / 100;
  const Y = (inv(fy) * D65[1]) / 100;
  const Z = (inv(fz) * D65[2]) / 100;
  return [
    toSrgb(X * 3.2406 + Y * -1.5372 + Z * -0.4986),
    toSrgb(X * -0.9689 + Y * 1.8758 + Z * 0.0415),
    toSrgb(X * 0.0557 + Y * -0.204 + Z * 1.057),
  ];
}

const inGamut = (rgb: number[]) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

/**
 * Render a tone / chroma / hue as `#rrggbb`.
 *
 * When the request falls outside sRGB the **chroma** is reduced until it
 * fits and the tone is never touched. That ordering is the whole point:
 * the tone is what the contrast guarantee rests on, so a vivid colour
 * may come back a little less vivid, but never a little lighter.
 */
export function lchToHex(L: number, C: number, H: number): string {
  let lo = 0;
  let hi = C;
  if (inGamut(lchToRgb(L, C, H))) {
    lo = C;
  } else {
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (inGamut(lchToRgb(L, mid, H))) lo = mid;
      else hi = mid;
    }
  }
  const rgb = lchToRgb(L, lo, H).map((c) =>
    Math.round(Math.max(0, Math.min(1, c)) * 255),
  );
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The tone each step sits at. The contract in `palette.ts` is a
 * consequence of these numbers and of nothing else.
 */
export const TONES: Record<keyof ColorRamp, number> = {
  '50': 97,
  '100': 92,
  '200': 85,
  '300': 76,
  '400': 65,
  '500': 57,
  '600': 49,
  '700': 41,
  '800': 32,
  '900': 23,
  '950': 13,
};

/**
 * Surfaces all live on the neutral ramp, so it needs more range at both
 * ends than a chromatic one: a dark page belongs at T8, where a hue has
 * no reason to go past T13.
 */
export const NEUTRAL_TONES: Record<keyof ColorRamp, number> = {
  '50': 98,
  '100': 95,
  '200': 89,
  '300': 80,
  '400': 66,
  '500': 53,
  '600': 44,
  '700': 35,
  '800': 26,
  '900': 16,
  '950': 8,
};

/**
 * Chroma peaks where a hue is most itself and tapers at both ends.
 * Without the taper the palest steps come back as fluorescent pastels
 * and the deepest as muddy near-blacks.
 */
const CHROMA: Record<keyof ColorRamp, number> = {
  '50': 0.14,
  '100': 0.26,
  '200': 0.48,
  '300': 0.72,
  '400': 0.92,
  '500': 1,
  '600': 1,
  '700': 0.94,
  '800': 0.84,
  '900': 0.72,
  '950': 0.55,
};

export interface MakeRampOptions {
  /** Use the wider neutral tone map. @default false */
  neutral?: boolean;
  /** Override the peak chroma. Defaults to the seed's own. */
  chroma?: number;
}

/**
 * Build a full ramp from one brand colour.
 *
 * Only the seed's **hue and chroma** are used. Its lightness is
 * discarded on purpose: where the brand colour happens to sit is not
 * where the ramp's steps belong, and honouring it is exactly how a scale
 * ends up with a different real lightness per hue.
 *
 * @example
 * ```ts
 * const brand = makeRamp('#4c68ee');
 * const grey  = makeRamp('#4c68ee', { neutral: true, chroma: 6 });
 * ```
 */
export function makeRamp(seed: string, options: MakeRampOptions = {}): ColorRamp {
  const { C, H } = hexToLch(seed);
  const tones = options.neutral ? NEUTRAL_TONES : TONES;
  const peak = options.chroma ?? C;
  const out = {} as Record<keyof ColorRamp, string>;
  for (const step of Object.keys(tones) as Array<keyof ColorRamp>) {
    out[step] = lchToHex(tones[step], peak * CHROMA[step], H);
  }
  return out as ColorRamp;
}
