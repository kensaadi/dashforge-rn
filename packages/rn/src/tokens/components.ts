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
import type { ActionRole, SemanticTokens, TypeStyle } from './types';

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
