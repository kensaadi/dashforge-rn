/**
 * Tier 1: primitives.
 *
 * Raw values, named for what they are and never for what they are for.
 * Nothing outside `semantic.ts` may reference this file: primitives exist
 * to be pointed at by the semantic tier and by nothing else.
 *
 * ## Every step is a tone, not an arbitrary number
 *
 * The ramps are generated in CIE LCh at fixed **L\*** tones. That is the
 * axis Material 3 calls "tone", and the reason it uses it: L\* is
 * perceptual lightness, so a step means the same lightness for a green
 * as for a blue. HSL lightness does not, which is why a red at HSL 50%
 * measures lighter than a blue at HSL 50% and why a palette built that
 * way needs hand-tuning per hue to stay legible.
 *
 * With tones, Material's arithmetic applies and legibility stops being
 * something to search for:
 *
 * > two tones **40 apart** contrast at least **3:1**
 * > two tones **50 apart** contrast at least **4.5:1**
 *
 * | step | tone | job |
 * |---|---|---|
 * | 50  | 97 | page background, palest tint |
 * | 100 | 92 | tinted background for a feedback surface |
 * | 200 | 85 | tinted border, subtle fill |
 * | 300 | 76 | border; label on a dark page |
 * | 400 | 65 | **fill for a dark-label role** |
 * | 500 | 57 | hover and emphasis |
 * | 600 | 49 | **fill for a light-label role** |
 * | 700 | 41 | label on a light page |
 * | 800 | 32 | text on a tinted background |
 * | 900 | 23 | **label on a dark-label fill** |
 * | 950 | 13 | deepest text |
 *
 * The pairs that matter therefore hold for every hue by construction,
 * and `contrast.test.ts` asserts each one rather than trusting it:
 *
 * - white on `600` (delta 51)  ->  4.6:1
 * - `950` on `400` (delta 52)  ->  5.9:1
 * - `700` on a `50` page (delta 56)
 * - `800` on a `100` tint (delta 60)
 *
 * `neutral` runs its own tone map, wider at both ends. Every surface in
 * the product lives on it, and a dark page needs to reach T8 where a
 * chromatic ramp has no reason to go past T13.
 */

/** A tonal ramp, lightest (50) to darkest (950). */
export interface ColorRamp {
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
  '950': string;
}

/**
 * The Dashforge hues.
 *
 * Generated from a single lightness rhythm with a saturation curve that
 * peaks mid-ramp, so every hue steps at the same perceived rate and the
 * extremes never read as neon. `neutral` is deliberately cool rather
 * than achromatic: a true grey next to a blue-family accent reads dead.
 *
 * Note that `primary` here is a **meaning**, not a hue name, and so it
 * lives in the semantic tier. What this object holds is the raw ramps
 * those meanings point at.
 *
 * **The lightness curve is tuned per hue, not shared.** Equal HSL
 * lightness does not give equal luminance: at the same step a red is
 * measurably lighter than a blue, because red and green carry most of
 * the luminance weight. `danger` therefore runs a few points darker
 * through its middle so its action steps carry a white label, with the
 * offset tapering to nothing at both ends so the palest tints stay
 * usable as tinted backgrounds and the deepest stay usable as text.
 *
 * `success` and `warning` are **not** given the same treatment, and that
 * is deliberate rather than an omission. Green and amber do not carry
 * white at any lightness that still reads as green or amber; forcing
 * them produces bottle green and brown. They take a dark label instead,
 * which is what every serious system does with an amber button. The
 * contract each role is held to is asserted in `contrast.test.ts`.
 */
export const palette = {
  primary: {
    '50': '#f6f5ff',
    '100': '#e8e5ff',
    '200': '#d3d0ff',
    '300': '#b7b4ff',
    '400': '#8f93ff',
    '500': '#6c7cff',
    '600': '#4c68ee',
    '700': '#3555d0',
    '800': '#2042aa',
    '900': '#0c2f84',
    '950': '#021c59',
  },
  success: {
    '50': '#e9fbef',
    '100': '#cff0db',
    '200': '#a4e2bd',
    '300': '#6cce99',
    '400': '#1db473',
    '500': '#009d62',
    '600': '#008653',
    '700': '#006f44',
    '800': '#005734',
    '900': '#004025',
    '950': '#002815',
  },
  warning: {
    '50': '#fff5eb',
    '100': '#ffe3c9',
    '200': '#ffcb93',
    '300': '#f3ae5a',
    '400': '#db8d17',
    '500': '#c17900',
    '600': '#a56700',
    '700': '#8a5500',
    '800': '#6c4200',
    '900': '#503000',
    '950': '#311e00',
  },
  danger: {
    '50': '#fff4f2',
    '100': '#ffe2dc',
    '200': '#ffc7bd',
    '300': '#ffa493',
    '400': '#ff725e',
    '500': '#f7493b',
    '600': '#dd2f29',
    '700': '#bf1b1c',
    '800': '#9b0510',
    '900': '#750006',
    '950': '#470900',
  },
  info: {
    '50': '#eef8ff',
    '100': '#d1ecff',
    '200': '#a5dbff',
    '300': '#5ac6ff',
    '400': '#00a9e5',
    '500': '#0093c7',
    '600': '#007daa',
    '700': '#00688e',
    '800': '#005170',
    '900': '#003b53',
    '950': '#002535',
  },
  neutral: {
    '50': '#f9f9fb',
    '100': '#eff1f4',
    '200': '#dde0e5',
    '300': '#c3c6ce',
    '400': '#9da0aa',
    '500': '#7a7f89',
    '600': '#646872',
    '700': '#4f525b',
    '800': '#3a3e45',
    '900': '#25282e',
    '950': '#16181c',
  },
} as const satisfies Record<string, ColorRamp>;

/** Every ramp name available to the semantic tier. */
export type PaletteName = keyof typeof palette;

/**
 * A complete set of ramps.
 *
 * Structural on purpose. Typing this as `typeof palette` would carry the
 * shipped hex values as literal types, and a consumer's own ramps would
 * then fail to satisfy it: the whole point of the tier is that the
 * meanings above it work against *any* set of ramps, not only this one.
 */
export interface Palette {
  primary: ColorRamp;
  success: ColorRamp;
  warning: ColorRamp;
  danger: ColorRamp;
  info: ColorRamp;
  neutral: ColorRamp;
}

/**
 * Raw spacing scale in density-independent pixels. Not rem, not
 * strings: React Native measures in dp and any string here would be a
 * runtime error rather than a unit conversion.
 */
export const size = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

/** Opaque white and black, for the rare token that genuinely needs them. */
export const absolute = {
  white: '#ffffff',
  black: '#000000',
} as const;
