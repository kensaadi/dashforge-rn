/**
 * Build a complete, contract-abiding palette from brand colours.
 *
 * The safe path for a consumer. Hand-authored ramps are accepted by
 * `defineTheme` but only checked, not corrected; a palette built here
 * cannot fail the contract because the tones are not up for negotiation.
 */
import { contrast } from './contrast';
import { makeRamp } from './lch';
import { palette as shipped } from './palette';
import type { ColorRamp, Palette } from './palette';

export interface MakePaletteOptions {
  /** The brand colour. Only its hue and chroma are used. */
  primary: string;
  /**
   * Feedback hues. Left alone by default, because they are meanings
   * rather than brand: a product that recolours its error state to match
   * its logo has stopped communicating.
   */
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  /**
   * The grey. Given a colour it is tinted towards that hue; given
   * nothing it is tinted towards `primary`, which is what stops a grey
   * from looking dead next to a saturated accent.
   */
  neutral?: string;
  /**
   * Chroma of the neutral ramp. Above roughly 10 the greys stop reading
   * as grey.
   * @default 6
   */
  neutralChroma?: number;
}

/**
 * @example
 * ```ts
 * // A whole palette from one hex.
 * const p = makePalette({ primary: '#7c3aed' });
 *
 * // Brand plus a house red.
 * const p = makePalette({ primary: '#7c3aed', danger: '#b3261e' });
 * ```
 */
export function makePalette(options: MakePaletteOptions): Palette {
  const ramp = (seed: string | undefined, fallback: ColorRamp) =>
    seed ? makeRamp(seed) : fallback;

  return {
    primary: makeRamp(options.primary),
    success: ramp(options.success, shipped.success),
    warning: ramp(options.warning, shipped.warning),
    danger: ramp(options.danger, shipped.danger),
    info: ramp(options.info, shipped.info),
    neutral: makeRamp(options.neutral ?? options.primary, {
      neutral: true,
      chroma: options.neutralChroma ?? 6,
    }),
  };
}

/** One pairing that failed, with the numbers rather than a verdict. */
export interface ContractViolation {
  role: string;
  pair: string;
  measured: number;
  required: number;
}

/**
 * Check a palette against the pairings the semantic tier relies on.
 *
 * Returns the failures rather than throwing, so a caller can decide
 * whether a bad palette is worth stopping for. `defineTheme` warns in
 * development and says nothing in production: a contrast problem is
 * worth interrupting a developer over, never a user.
 */
export function checkPaletteContract(p: Palette): ContractViolation[] {
  const out: ContractViolation[] = [];
  const roles = ['primary', 'success', 'warning', 'danger', 'info'] as const;
  const check = (
    role: string,
    pair: string,
    a: string,
    b: string,
    required: number,
  ) => {
    const measured = contrast(a, b);
    if (measured < required) out.push({ role, pair, measured, required });
  };

  for (const role of roles) {
    const r = p[role];
    check(role, 'white on 600 (a light-label fill)', '#ffffff', r['600'], 4.5);
    check(role, '950 on 400 (a dark-label fill)', r['950'], r['400'], 4.5);
    check(role, '700 on the light page', r['700'], p.neutral['50'], 4.5);
    check(role, '400 on the dark page', r['400'], p.neutral['950'], 4.5);
    check(role, '800 on its own 100 tint', r['800'], r['100'], 4.5);
  }

  const n = p.neutral;
  check('neutral', 'body text on the light page', n['900'], n['50'], 4.5);
  check('neutral', 'body text on the dark page', n['50'], n['950'], 4.5);
  check('neutral', 'secondary text on the light page', n['700'], n['50'], 4.5);
  check('neutral', 'secondary text on the dark page', n['300'], n['950'], 4.5);

  return out;
}

/**
 * Format the failures as something a developer can act on: which pair,
 * what it measured, what it needed, and the one instruction that fixes
 * all of them at once.
 *
 * @internal
 */
export function formatViolations(v: ContractViolation[]): string {
  const lines = v.map(
    (x) =>
      `  ${x.role}: ${x.pair} measured ${x.measured.toFixed(2)}, needs ${x.required}`,
  );
  return [
    `[@dashforge/rn] This palette does not meet the contrast contract (${v.length} ${
      v.length === 1 ? 'pairing' : 'pairings'
    }):`,
    ...lines,
    '',
    'Ramps authored in HSL or HSB fail this routinely: those are not',
    'perceptual, so the same step lands on a different real lightness for',
    'every hue. Build the palette from a brand colour instead and the',
    'tones come out right by construction:',
    '',
    "  import { makePalette } from '@dashforge/rn/tokens';",
    "  const palette = makePalette({ primary: '#your-brand-hex' });",
  ].join('\n');
}
