/**
 * Tier 2: semantic.
 *
 * What a value is *for*. This is the only tier that swaps between light
 * and dark: primitives never change, and component tokens never change
 * either because they point at these. No component knows a mode exists.
 *
 * See ARCHITECTURE.md section 6 for the pipeline and section 15 for the
 * decided visual language (flat fills and borders, elevation only for
 * what genuinely floats).
 */
import { absolute, palette as defaultPalette } from './palette';
import type { ColorRamp, Palette } from './palette';

import type { ActionRole, ElevationStyle, FeedbackRole, SemanticTokens } from './types';

/** The five action roles. */
type ActionColor = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

/**
 * Options both factories take.
 */
export interface SemanticOptions {
  /**
   * Roles whose fill keeps its hue and takes a **dark** label, instead of
   * being pushed deep enough to carry white.
   *
   * This is the one place the system follows Apple rather than Material.
   * Material's uniformity comes from putting every fill at the same tone,
   * which works but turns an amber into an ochre and a green into a
   * bottle green. Apple keeps `systemOrange` and `systemYellow` vivid and
   * darkens the label instead. Both are legitimate; this is a choice, not
   * a workaround.
   *
   * @default ['success', 'warning']
   */
  darkLabelRoles?: readonly ActionColor[];
  /**
   * Honour the platform's "Increase Contrast" setting.
   *
   * Both operating systems expose it and both adapt their own colours to
   * it. Deepening text, strengthening borders and making separators
   * opaque is what that setting asks for.
   *
   * @default false
   */
  highContrast?: boolean;
}

const DEFAULT_DARK_LABEL: readonly ActionColor[] = ['success', 'warning'];

/**
 * One action role, straight from the tone contract.
 *
 * There is no search here any more, and that is the point of moving the
 * ramps onto a perceptual tone axis: `600` carries white and `400`
 * carries `950` for **every** hue, so the pairing is arithmetic rather
 * than something to discover per palette.
 *
 * The press still obeys the rule the rest of the system obeys: the fill
 * moves *away* from the label. Under a white label that is one tone
 * deeper, under a dark one it is one tone lighter, and either way the
 * contrast after the press is better than before it.
 */
function actionRole(
  ramp: ColorRamp,
  o: { dark: boolean; darkLabel: boolean; hc: boolean; n: ColorRamp },
): ActionRole {
  const { dark, darkLabel, hc, n } = o;

  const fillStep = darkLabel ? '400' : hc ? '700' : '600';
  const pressStep = darkLabel ? '300' : hc ? '800' : '700';
  const fg = darkLabel ? ramp['950'] : absolute.white;

  return {
    bg: ramp[fillStep],
    bgPressed: ramp[pressStep],
    bgDisabled: dark ? n['800'] : n['200'],
    fg,
    fgDisabled: dark ? n['400'] : n['500'],
    border: dark ? ramp['400'] : ramp['600'],
    // A label on the page rather than on a fill, for outline / ghost /
    // link. Tone 41 against a tone-98 page, or tone 65 against tone 8.
    fgSubtle: dark ? ramp['400'] : ramp[hc ? '800' : '700'],
    fgPressed: dark ? ramp['300'] : ramp[hc ? '900' : '800'],
    bgSubtlePressed: dark ? ramp['900'] : ramp['100'],
  };
}

/** `secondary` is the neutral ramp, not a second brand hue. */
function neutralAction(n: ColorRamp, dark: boolean, hc: boolean): ActionRole {
  return {
    // Never the page's own tone: a fill equal to `surface.base` turns
    // `solid` into `outline` and one variant silently disappears.
    bg: dark ? n['800'] : n['200'],
    // A neutral fill goes the other way in dark. Deepening it on a dark
    // ground walks it into the page instead of reading as pressed.
    bgPressed: dark ? n['700'] : n['300'],
    bgDisabled: dark ? n['800'] : n['200'],
    fg: dark ? n['50'] : n['900'],
    fgDisabled: dark ? n['400'] : n['500'],
    border: dark ? n[hc ? '500' : '700'] : n[hc ? '600' : '300'],
    fgSubtle: dark ? n['50'] : n['900'],
    fgPressed: dark ? absolute.white : n['950'],
    bgSubtlePressed: dark ? n['800'] : n['200'],
  };
}

/** A tinted surface with text on it. Tones 92 and 32, or 13 and 76. */
function feedbackRole(ramp: ColorRamp, dark: boolean, hc: boolean): FeedbackRole {
  return {
    bg: dark ? ramp['950'] : ramp['100'],
    fg: dark ? ramp[hc ? '200' : '300'] : ramp[hc ? '900' : '800'],
    border: dark ? ramp[hc ? '700' : '800'] : ramp[hc ? '300' : '200'],
  };
}

function elevation(
  height: number,
  opacity: number,
  radius: number,
  android: number,
): ElevationStyle {
  return {
    shadowColor: absolute.black,
    shadowOffset: { width: 0, height },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: android,
  };
}

const FLAT = elevation(0, 0, 0, 0);

/**
 * The radius steps.
 *
 * A size scale under the role scale rather than instead of it: the roles
 * say what a thing is, the steps say how much, and a component that
 * offers roundness as a prop needs the steps to name.
 */
const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

const shared = {
  radius: {
    ...RADIUS,
    // Named by job, valued by step. Writing 8 here again is how a role
    // and its step end up disagreeing six months later.
    control: RADIUS.md,
    surface: RADIUS.lg,
    pill: RADIUS.full,
  },
  borderWidth: {
    // Deliberately 0.5 rather than `StyleSheet.hairlineWidth`: this file
    // may not import from react-native, and a fixed 0.5 is predictable
    // across densities where `1 / PixelRatio` is not.
    hairline: 0.5,
    default: 1,
    strong: 2,
  },
  space: {
    inline: 8,
    stack: 12,
    inset: 16,
    section: 32,
  },
  control: {
    minHeight: { sm: 36, md: 44, lg: 52 },
  },
  typography: {
    display: {
      fontSize: 32,
      lineHeight: 1.19,
      fontWeight: '700',
      letterSpacing: -0.4,
      maxFontSizeMultiplier: 1.6,
    },
    title: {
      fontSize: 24,
      lineHeight: 1.25,
      fontWeight: '700',
      letterSpacing: -0.2,
      maxFontSizeMultiplier: 1.6,
    },
    subtitle: {
      fontSize: 18,
      lineHeight: 1.33,
      fontWeight: '500',
      maxFontSizeMultiplier: 1.6,
    },
    // Reading text carries no cap on purpose: scaling it is the entire
    // point of the system setting, and capping it is capping the reader.
    body: { fontSize: 16, lineHeight: 1.5, fontWeight: '400' },
    bodySmall: { fontSize: 14, lineHeight: 1.43, fontWeight: '400' },
    label: {
      fontSize: 15,
      lineHeight: 1.33,
      fontWeight: '500',
      maxFontSizeMultiplier: 1.5,
    },
    caption: {
      fontSize: 13,
      lineHeight: 1.38,
      fontWeight: '400',
      letterSpacing: 0.1,
      maxFontSizeMultiplier: 1.4,
    },
    // `fontFamily` stays undefined: there is no single monospace face
    // present on both platforms, and this file may not call
    // `Platform.select`. An app that needs true monospace supplies the
    // family it has loaded.
    mono: {
      fontSize: 14,
      lineHeight: 1.43,
      fontWeight: '400',
      maxFontSizeMultiplier: 1.3,
    },
  },
  opacity: {
    disabled: 0.45,
  },
  motion: {
    instant: 0,
    quick: 120,
    standard: 200,
    deliberate: 320,
  },
  zIndex: {
    base: 0,
    sticky: 10,
    overlay: 100,
    modal: 200,
    toast: 300,
  },
} as const satisfies Partial<SemanticTokens>;

/**
 * Build the light semantic layer for any palette.
 *
 * Only this tier changes with the mode, and now also with the platform's
 * contrast setting. Primitives never change, and component tokens never
 * change either because they point at these.
 */
export function makeSemanticLight(p: Palette, o: SemanticOptions = {}): SemanticTokens {
  const n = p.neutral;
  const hc = o.highContrast ?? false;
  const darkLabel = new Set(o.darkLabelRoles ?? DEFAULT_DARK_LABEL);
  const role = (name: ActionColor, ramp: ColorRamp) =>
    actionRole(ramp, { dark: false, darkLabel: darkLabel.has(name), hc, n });

  return {
    ...shared,
    surface: {
      base: n['50'],
      raised: absolute.white,
      sunken: n['100'],
      overlay: absolute.white,
      inverse: n['900'],
    },
    text: {
      primary: hc ? n['950'] : n['900'],
      secondary: hc ? n['800'] : n['700'],
      muted: hc ? n['700'] : n['600'],
      disabled: n['400'],
      inverse: n['50'],
      onAccent: absolute.white,
    },
    border: {
      subtle: hc ? n['300'] : n['200'],
      default: hc ? n['500'] : n['300'],
      strong: hc ? n['600'] : n['400'],
      focus: p.primary['600'],
    },
    fill: { subtle: n['100'], default: n['200'], strong: n['300'] },
    separator: {
      // Opaque under Increase Contrast: a translucent hairline is the
      // first thing to disappear when somebody has asked for more edge.
      default: hc ? n['300'] : 'rgba(37, 40, 46, 0.14)',
      opaque: hc ? n['300'] : n['200'],
    },
    action: {
      primary: role('primary', p.primary),
      secondary: neutralAction(n, false, hc),
      danger: role('danger', p.danger),
      success: role('success', p.success),
      warning: role('warning', p.warning),
    },
    feedback: {
      success: feedbackRole(p.success, false, hc),
      warning: feedbackRole(p.warning, false, hc),
      danger: feedbackRole(p.danger, false, hc),
      info: feedbackRole(p.info, false, hc),
    },
    overlay: { scrim: 'rgba(22, 24, 28, 0.5)' },
    elevation: {
      flat: FLAT,
      raised: elevation(1, 0.06, 2, 1),
      floating: elevation(4, 0.1, 12, 6),
      modal: elevation(8, 0.16, 24, 12),
    },
  };
}

/**
 * Build the dark semantic layer for any palette.
 *
 * `surface.sunken` is *lighter* than `surface.base` here, not darker: on
 * a dark page a recessed well reads as lifted. Inverting the light-mode
 * relationship literally is the usual way dark themes end up wrong.
 */
export function makeSemanticDark(p: Palette, o: SemanticOptions = {}): SemanticTokens {
  const n = p.neutral;
  const hc = o.highContrast ?? false;
  const darkLabel = new Set(o.darkLabelRoles ?? DEFAULT_DARK_LABEL);
  const role = (name: ActionColor, ramp: ColorRamp) =>
    actionRole(ramp, { dark: true, darkLabel: darkLabel.has(name), hc, n });

  return {
    ...shared,
    surface: {
      base: n['950'],
      raised: n['900'],
      sunken: n['800'],
      overlay: n['900'],
      inverse: n['50'],
    },
    text: {
      primary: n['50'],
      secondary: hc ? n['200'] : n['300'],
      muted: hc ? n['300'] : n['400'],
      disabled: n['600'],
      inverse: n['900'],
      onAccent: absolute.white,
    },
    border: {
      subtle: hc ? n['700'] : n['800'],
      default: hc ? n['500'] : n['700'],
      strong: hc ? n['400'] : n['600'],
      focus: p.primary['400'],
    },
    fill: { subtle: n['900'], default: n['800'], strong: n['700'] },
    separator: {
      default: hc ? n['600'] : 'rgba(249, 249, 251, 0.16)',
      opaque: hc ? n['600'] : n['800'],
    },
    action: {
      primary: role('primary', p.primary),
      secondary: neutralAction(n, true, hc),
      danger: role('danger', p.danger),
      success: role('success', p.success),
      warning: role('warning', p.warning),
    },
    feedback: {
      success: feedbackRole(p.success, true, hc),
      warning: feedbackRole(p.warning, true, hc),
      danger: feedbackRole(p.danger, true, hc),
      info: feedbackRole(p.info, true, hc),
    },
    overlay: { scrim: 'rgba(0, 0, 0, 0.6)' },
    elevation: {
      flat: FLAT,
      // Shadows barely read on a dark ground, so the same steps carry
      // more opacity. Separation still comes mostly from surface lightness.
      raised: elevation(1, 0.24, 2, 1),
      floating: elevation(4, 0.36, 12, 6),
      modal: elevation(8, 0.5, 24, 12),
    },
  };
}

/** The shipped light theme's semantic layer. */
export const semanticLight: SemanticTokens = makeSemanticLight(defaultPalette);

/** The shipped dark theme's semantic layer. */
export const semanticDark: SemanticTokens = makeSemanticDark(defaultPalette);
