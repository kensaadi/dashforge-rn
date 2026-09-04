/**
 * @dashforge/rn/tokens
 *
 * Tier 1 (primitive) and tier 2 (semantic) tokens, plus the tier 3
 * registry that components augment.
 *
 * Nothing here references React or React Native: these are values and
 * types only, so they stay usable by tooling that never renders.
 *
 * See ARCHITECTURE.md section 6.
 */

export { palette, size, absolute } from './palette';
export type { ColorRamp, Palette, PaletteName } from './palette';

export {
  semanticLight,
  semanticDark,
  makeSemanticLight,
  makeSemanticDark,
} from './semantic';
export { contrast, luminance, TONE_DELTA } from './contrast';

export { makeRamp, hexToLch, lchToHex, TONES, NEUTRAL_TONES } from './lch';
export type { Lch, MakeRampOptions } from './lch';

export { makePalette, checkPaletteContract } from './makePalette';
export type { MakePaletteOptions, ContractViolation } from './makePalette';

export { defaultComponentTokens } from './components';
export type {
  ActionColor,
  SizeScale,
  ButtonTokens,
  IconButtonTokens,
  TextFieldTokens,
} from './components';

export type {
  SemanticTokens,
  ComponentTokens,
  ActionRole,
  FeedbackRole,
  TypeStyle,
  ElevationStyle,
  ThemeMode,
} from './types';
