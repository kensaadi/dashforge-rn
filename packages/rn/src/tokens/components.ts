/**
 * Tier 3: component tokens.
 *
 * Every component declares the token surface it reads, and this file
 * builds the default values from the semantic tier. A component's recipe
 * may read **these** and nothing above them, which is what makes the
 * whole system configurable: if every style a component can produce
 * traces to a component token, every style a component can produce is
 * reachable from the theme.
 *
 * See ARCHITECTURE.md section 6.
 */
import type { ActionRole, ElevationStyle, SemanticTokens, TypeStyle } from './types';

/** The five action roles a Button can take. */
export type ActionColor = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

/** Per-size numbers, shared by every control that has three sizes. */
export interface SizeScale {
  sm: number;
  md: number;
  lg: number;
}

export interface ButtonTokens {
  radius: number;
  borderWidth: number;
  typography: TypeStyle;
  /** Applied as `minHeight`, never `height`, so the label may grow. */
  minHeight: SizeScale;
  paddingHorizontal: SizeScale;
  /** Smaller than the icon of an `IconButton`: paired with a label it accompanies. */
  iconSize: SizeScale;
  gap: SizeScale;
  /** Extra touch area, so `sm` still clears the 44pt floor. */
  hitSlop: SizeScale;
  role: Record<ActionColor, ActionRole>;
}

export interface TextFieldTokens {
  radius: number;
  borderWidth: number;
  /** Border while focused. Thicker rather than only recoloured: the ring
   * has to read for someone who cannot distinguish the two colours. */
  borderWidthFocused: number;
  /** Vertical rhythm between label, control and helper. */
  gap: number;
  minHeight: SizeScale;
  paddingHorizontal: SizeScale;
  typography: {
    label: TypeStyle;
    input: TypeStyle;
    helper: TypeStyle;
  };
  color: {
    bg: string;
    bgDisabled: string;
    border: string;
    borderFocused: string;
    borderInvalid: string;
    borderDisabled: string;
    text: string;
    textDisabled: string;
    placeholder: string;
    label: string;
    labelDisabled: string;
    helper: string;
    helperInvalid: string;
    required: string;
    /** The text caret and the selection highlight. */
    caret: string;
  };
}

/** The meanings a Card can carry beyond the neutral one. */
export type CardTone = 'success' | 'warning' | 'danger' | 'info';

/** A tinted card: its ground, its edge, and the text that sits on it. */
export interface CardToneStyle {
  bg: string;
  /**
   * Pressed ground.
   *
   * One step along the same ramp, taken from the role's border colour
   * because that is exactly where that step lands: darker than the tint
   * in light, lighter than it in dark. The alternative was adding a
   * field to `FeedbackRole`, which serves banners and badges and has no
   * pressed state to speak of.
   */
  bgPressed: string;
  border: string;
  /** Title and subtitle both, because muted neutral text on a tint is muddy. */
  fg: string;
}

export interface CardTokens {
  radius: number;
  borderWidth: number;
  /** Between the card's own children, so a card is a stack by default. */
  gap: number;
  padding: SizeScale;
  color: {
    /** `outlined` and `elevated`. */
    bg: string;
    /**
     * `filled`.
     *
     * On the surface scale rather than the fill scale, because the fill
     * steps collapse onto `surface.raised` in dark mode and a filled card
     * inside an ordinary one would vanish.
     */
    bgFilled: string;
    /**
     * Pressed background for `outlined` and `elevated`.
     *
     * `surface.sunken` rather than a fill, because it is the one token
     * that moves the right way in both modes: darker than a white card
     * in light, lighter than a near-black one in dark. A fixed direction
     * would make the press invisible in one of the two.
     */
    bgPressed: string;
    /** Pressed background for `filled`, one fill step up. */
    bgFilledPressed: string;
    border: string;
    title: string;
    subtitle: string;
    /** The hairline a footer can draw above itself. */
    divider: string;
    /**
     * Text over a cover image, and the same in both modes.
     *
     * A photograph does not invert with the theme, so neither can the
     * text on it. These are the only colours in the component that do not
     * follow the mode, and that is the point.
     */
    onCover: string;
    onCoverMuted: string;
    /**
     * The veil between a cover image and its text.
     *
     * Flat rather than a gradient: a gradient would want a dependency,
     * and the library ships three. Flat is less pretty and always
     * correct, which is the right trade for the thing that decides
     * whether the words can be read.
     */
    scrim: string;
  };
  /** The tinted grounds, one per meaning. `neutral` is the absence of one. */
  tone: Record<CardTone, CardToneStyle>;
  typography: {
    title: TypeStyle;
    subtitle: TypeStyle;
  };
  /**
   * The shadow `elevated` carries, expressed once and expanded to both
   * platforms. Nothing else in the library reads the elevation scale yet.
   */
  elevation: ElevationStyle;
}

export interface IconButtonTokens {
  radius: number;
  borderWidth: number;
  size: SizeScale;
  /** Larger than the icon inside a Button: alone it carries the whole meaning. */
  iconSize: SizeScale;
  hitSlop: SizeScale;
  role: Record<ActionColor, ActionRole>;
}

declare module './types' {
  interface ComponentTokens {
    Button?: {
      defaults?: Record<string, unknown>;
      tokens?: ButtonTokens;
    };
    Card?: {
      defaults?: Record<string, unknown>;
      tokens?: CardTokens;
    };
    IconButton?: {
      defaults?: Record<string, unknown>;
      tokens?: IconButtonTokens;
    };
    TextField?: {
      defaults?: Record<string, unknown>;
      tokens?: TextFieldTokens;
    };
  }
}

/** @internal The floor every touch target has to clear, in points. */
const TOUCH_TARGET = 44;

function hitSlopFor(heights: SizeScale): SizeScale {
  const pad = (h: number) => Math.max(0, Math.round((TOUCH_TARGET - h) / 2));
  return { sm: pad(heights.sm), md: pad(heights.md), lg: pad(heights.lg) };
}

/** Default component tokens, derived from a semantic layer. */
/** Build one tinted ground from the feedback role of the same name. */
function toneOf(s: SemanticTokens, role: CardTone): CardToneStyle {
  const r = s.feedback[role];
  return { bg: r.bg, bgPressed: r.border, border: r.border, fg: r.fg };
}

export function defaultComponentTokens(s: SemanticTokens) {
  const role: Record<ActionColor, ActionRole> = {
    primary: s.action.primary,
    secondary: s.action.secondary,
    danger: s.action.danger,
    success: s.action.success,
    warning: s.action.warning,
  };

  const buttonHeights = s.control.minHeight;
  const fieldHeights = s.control.minHeight;
  const iconButtonSizes = s.control.minHeight;

  return {
    Button: {
      tokens: {
        radius: s.radius.control,
        borderWidth: s.borderWidth.default,
        typography: s.typography.label,
        minHeight: buttonHeights,
        paddingHorizontal: { sm: 12, md: 16, lg: 20 },
        iconSize: { sm: 16, md: 18, lg: 20 },
        gap: { sm: 6, md: 8, lg: 8 },
        hitSlop: hitSlopFor(buttonHeights),
        role,
      } satisfies ButtonTokens,
    },
    TextField: {
      tokens: {
        radius: s.radius.control,
        borderWidth: s.borderWidth.default,
        borderWidthFocused: s.borderWidth.strong,
        gap: 6,
        minHeight: fieldHeights,
        paddingHorizontal: { sm: 10, md: 12, lg: 14 },
        typography: {
          label: s.typography.label,
          input: s.typography.body,
          helper: s.typography.caption,
        },
        color: {
          // A field is a flat surface with a border, like everything
          // else in this language. The well look would need `sunken`,
          // which reads wrong inside a card that is already raised.
          bg: s.surface.raised,
          bgDisabled: s.fill.subtle,
          border: s.border.default,
          borderFocused: s.border.focus,
          borderInvalid: s.action.danger.bg,
          borderDisabled: s.border.subtle,
          text: s.text.primary,
          textDisabled: s.text.disabled,
          placeholder: s.text.muted,
          label: s.text.primary,
          labelDisabled: s.text.disabled,
          helper: s.text.muted,
          helperInvalid: s.feedback.danger.fg,
          required: s.action.danger.bg,
          caret: s.border.focus,
        },
      } satisfies TextFieldTokens,
    },
    Card: {
      tokens: {
        radius: s.radius.surface,
        borderWidth: s.borderWidth.default,
        gap: s.space.stack,
        padding: { sm: 12, md: s.space.inset, lg: 24 },
        color: {
          bg: s.surface.raised,
          // Not `fill.subtle`: in dark mode that lands on the same value
          // as `surface.raised`, so a filled card nested in an ordinary
          // one disappears. The surface scale is the one that keeps its
          // steps apart in both modes.
          bgFilled: s.surface.sunken,
          bgPressed: s.surface.sunken,
          // Two fill steps up rather than one, for the same reason:
          // `fill.default` equals `surface.sunken` in dark.
          bgFilledPressed: s.fill.strong,
          border: s.border.default,
          title: s.text.primary,
          subtitle: s.text.muted,
          // The opaque separator, not the translucent one: a card has a
          // ground of its own, and letting the page show through a line
          // drawn on it is the wrong effect.
          divider: s.separator.opaque,
          onCover: '#ffffff',
          onCoverMuted: 'rgba(255, 255, 255, 0.82)',
          scrim: '#000000',
        },
        tone: {
          success: toneOf(s, 'success'),
          warning: toneOf(s, 'warning'),
          danger: toneOf(s, 'danger'),
          info: toneOf(s, 'info'),
        },
        typography: {
          title: s.typography.subtitle,
          // The scale entry that exists for the second line of a list
          // item, which is the same job a card subtitle does.
          subtitle: s.typography.bodySmall,
        },
        elevation: s.elevation.raised,
      } satisfies CardTokens,
    },
    IconButton: {
      tokens: {
        radius: s.radius.control,
        borderWidth: s.borderWidth.default,
        size: iconButtonSizes,
        iconSize: { sm: 18, md: 20, lg: 24 },
        hitSlop: hitSlopFor(iconButtonSizes),
        role,
      } satisfies IconButtonTokens,
    },
  };
}
