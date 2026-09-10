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

/** A step on the radius scale, which is what a `radius` prop names. */
export type RadiusStep = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';

/**
 * The steps a component can be rounded to.
 *
 * Every box-drawing component carries the whole scale rather than one
 * number, because roundness is a prop: the recipe has to be able to
 * compile any step, and every step it can produce has to be reachable
 * from the theme.
 */
export type RadiusScale = Record<RadiusStep, number>;

/** Per-size numbers, shared by every control that has three sizes. */
export interface SizeScale {
  sm: number;
  md: number;
  lg: number;
}

export interface ButtonTokens {
  radius: RadiusScale;
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
  radius: RadiusScale;
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
  radius: RadiusScale;
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
  /**
   * How much a pressable card shrinks under the finger.
   *
   * Geometric and not chromatic, because a card whose ground is covered
   * by an image has no background left to change: a promo banner is one
   * picture and a tap target, and a colour it never shows is not
   * feedback. This works over anything, in both modes.
   *
   * Set it to 1 to turn it off.
   */
  pressScale: number;
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

export interface CheckboxTokens {
  radius: number;
  borderWidth: number;
  /** The box, per size. */
  box: SizeScale;
  /** Between the box and its label. */
  gap: number;
  /** Between the row and the helper text under it. */
  rowGap: number;
  /** Extra touch area, so even `sm` clears the 44pt floor. */
  hitSlop: SizeScale;
  /** Thickness of the drawn mark. */
  markWidth: SizeScale;
  typography: {
    label: TypeStyle;
    helper: TypeStyle;
  };
  color: {
    bg: string;
    bgChecked: string;
    bgDisabled: string;
    bgCheckedDisabled: string;
    border: string;
    borderChecked: string;
    borderInvalid: string;
    borderDisabled: string;
    /** The tick and the indeterminate bar, on the checked fill. */
    mark: string;
    markDisabled: string;
    label: string;
    labelDisabled: string;
    helper: string;
    helperInvalid: string;
    required: string;
  };
}

export interface SwitchTokens {
  /** The track, per size. Width and height; the radius is half the height. */
  track: { sm: { w: number; h: number }; md: { w: number; h: number }; lg: { w: number; h: number } };
  /** The circle, per size. */
  thumb: SizeScale;
  /** Between the thumb and the track's edge. */
  inset: SizeScale;
  /** Between the switch and its label. */
  gap: number;
  /** Between the row and the helper text under it. */
  rowGap: number;
  hitSlop: SizeScale;
  /** How long the thumb takes to cross. */
  duration: number;
  /** The thumb sits above the track, and says so. */
  elevation: ElevationStyle;
  typography: {
    label: TypeStyle;
    helper: TypeStyle;
  };
  color: {
    trackOff: string;
    trackOn: string;
    trackOffDisabled: string;
    trackOnDisabled: string;
    trackInvalid: string;
    thumb: string;
    thumbDisabled: string;
    label: string;
    labelDisabled: string;
    helper: string;
    helperInvalid: string;
    required: string;
  };
}

export interface RadioGroupTokens {
  /** The circle, per size. */
  circle: SizeScale;
  /** The dot inside it. */
  dot: SizeScale;
  borderWidth: number;
  /** Between a circle and its label. */
  gap: number;
  /** Between one option and the next. */
  optionGap: number;
  /** Between the group's own label, its options, and its helper. */
  groupGap: number;
  hitSlop: SizeScale;
  typography: {
    /** The group's question. */
    legend: TypeStyle;
    /** One option's answer. */
    label: TypeStyle;
    helper: TypeStyle;
  };
  color: {
    bg: string;
    bgDisabled: string;
    border: string;
    borderChecked: string;
    borderInvalid: string;
    borderDisabled: string;
    dot: string;
    dotDisabled: string;
    legend: string;
    label: string;
    labelDisabled: string;
    helper: string;
    helperInvalid: string;
    required: string;
  };
}

export interface StackTokens {
  /**
   * The named gaps, which are the spacing scale under another name so a
   * call site says why rather than how much.
   */
  gap: { none: number; inline: number; stack: number; inset: number; section: number };
  /** The line drawn between children when one is asked for. */
  divider: string;
  dividerWidth: number;
}

export interface ModalTokens {
  /** What darkens the page behind the panel. */
  scrim: string;
  /** The panel. */
  bg: string;
  radius: number;
  /** How far the panel stays from the screen's edges. */
  margin: number;
  padding: number;
  /** Between the panel's own children. */
  gap: number;
  /** Widths a dialog is allowed to reach. A phone hits `margin` first. */
  maxWidth: SizeScale;
  /**
   * How tall it may get before its content has to scroll, as a fraction
   * of the screen.
   */
  maxHeightRatio: number;
  /** The modal step of the elevation scale, which nothing else uses. */
  elevation: ElevationStyle;
}

export interface SnackbarTokens {
  radius: number;
  padding: number;
  /** Between the words and the action. */
  gap: number;
  /** From the screen's edges. */
  margin: number;
  maxWidth: number;
  elevation: ElevationStyle;
  typography: TypeStyle;
  /**
   * How long it stays, worked out from how much there is to read.
   *
   * A fixed duration is wrong at both ends: three seconds is plenty for
   * "Salvato" and not enough for a sentence, and the person reading is
   * not the person who wrote it.
   */
  reading: {
    /** Before a single character has been read. */
    base: number;
    perCharacter: number;
    min: number;
    max: number;
  };
  color: {
    /** The neutral ground: inverted, so it reads as an overlay and not as a card. */
    bg: string;
    fg: string;
    /** The action's label, which has to carry on the inverted ground. */
    action: string;
    /** Tinted grounds, one per meaning. */
    bgSuccess: string;
    bgWarning: string;
    bgDanger: string;
    bgInfo: string;
    /** Text on a tinted ground. */
    fgOnTone: string;
  };
}

export interface SelectTokens {
  radius: RadiusScale;
  borderWidth: number;
  borderWidthFocused: number;
  /** Vertical rhythm between label, trigger and helper. */
  gap: number;
  minHeight: SizeScale;
  paddingHorizontal: SizeScale;
  /** The mark that says it opens something. */
  chevron: { size: number; thickness: number };
  /**
   * How tall the list may get inside the dialog. The panel caps itself
   * too; this is what makes the list scroll rather than the panel.
   */
  listMaxHeight: number;
  typography: {
    label: TypeStyle;
    value: TypeStyle;
    helper: TypeStyle;
  };
  color: {
    bg: string;
    bgDisabled: string;
    border: string;
    borderOpen: string;
    borderInvalid: string;
    borderDisabled: string;
    value: string;
    /** The value when nothing is chosen yet. */
    placeholder: string;
    valueDisabled: string;
    chevron: string;
    label: string;
    labelDisabled: string;
    helper: string;
    helperInvalid: string;
    required: string;
  };
}

/** How much air a `Divider` keeps around itself. */
export interface DividerSpacing {
  none: number;
  sm: number;
  md: number;
  lg: number;
}

export interface DividerTokens {
  thickness: number;
  /**
   * The translucent separator and not a border colour: a divider is
   * dropped onto whatever ground the screen already has, and a solid
   * hairline picked for one of them is wrong on the others.
   */
  color: string;
  spacing: DividerSpacing;
  /** Between the label in the break and the lines either side of it. */
  labelGap: number;
  typography: { label: TypeStyle };
  labelColor: string;
}

/**
 * Five steps and not the usual three.
 *
 * A control's scale has three because a control has three roles. An
 * avatar is a picture of a person: it appears as a thumbnail in a row,
 * as a face in a header and as a portrait on a profile, and those are
 * further apart than any three numbers can cover.
 */
export interface AvatarSizeScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface AvatarTokens {
  size: AvatarSizeScale;
  /** The initials, one per step: a bigger circle needs bigger letters. */
  fontSize: AvatarSizeScale;
  /** The fallback glyph, when there is neither a picture nor a name. */
  iconSize: AvatarSizeScale;
  radius: RadiusScale;
  fontWeight: TypeStyle['fontWeight'];
  color: {
    /** The ground the initials sit on while there is no picture. */
    bg: string;
    fg: string;
  };
}

/** One badge colour, in both treatments. */
export interface BadgeToneStyle {
  solidBg: string;
  solidFg: string;
  softBg: string;
  softFg: string;
}

export interface BadgeTokens {
  height: number;
  /** So a single digit is a disc rather than a sliver. */
  minWidth: number;
  paddingHorizontal: number;
  radius: number;
  dotSize: number;
  typography: { label: TypeStyle };
  tone: Record<ActionColor, BadgeToneStyle>;
}

/**
 * The row that is a mobile application's table.
 *
 * The lines between rows are here too, and drawn by `List`, because a
 * row and the hairline above it are one decision: change the inset and
 * both have to agree or the list looks broken.
 */
export interface ListItemTokens {
  /** The floor a one-line row cannot go under, so it stays a target. */
  minHeight: number;
  paddingVertical: number;
  paddingHorizontal: number;
  /** Between the leading slot, the text and whatever is on the right. */
  gap: number;
  /** Between a title and the line under it. */
  titleGap: number;
  /** The icon a `leading` shorthand draws. */
  iconSize: number;
  /** The mark that says the row leads somewhere. */
  chevron: { size: number; thickness: number };
  separator: {
    thickness: number;
    color: string;
    /**
     * How far in an inset hairline starts.
     *
     * Lines up with the title of a row whose leading slot holds an icon
     * at `iconSize`, which is the row iOS designed the inset for. A
     * different leading slot needs `sx`, and the library says so rather
     * than measuring the slot and pretending it always knows.
     */
    inset: number;
  };
  typography: {
    title: TypeStyle;
    subtitle: TypeStyle;
    /** The short answer on the right. */
    value: TypeStyle;
  };
  color: {
    /**
     * Nothing at rest.
     *
     * A row has no ground of its own on purpose: it is dropped into a
     * card, a sheet or the page, and any colour it painted would be
     * right in one of those and wrong in the other two.
     */
    bg: string;
    bgPressed: string;
    title: string;
    subtitle: string;
    value: string;
    icon: string;
    chevron: string;
  };
}

export interface BottomSheetTokens {
  /** What darkens the page behind the sheet. */
  scrim: string;
  bg: string;
  /**
   * The whole scale, so a sheet can pick a step. Only the top corners
   * ever use it: the bottom is the screen's edge.
   */
  radius: RadiusScale;
  padding: number;
  /** Between the sheet's own children. */
  gap: number;
  /**
   * The grabber.
   *
   * Not decoration: it is the only part of the sheet that says it can be
   * dragged, and by default it is the only part that can be.
   */
  handle: { width: number; height: number; color: string; marginVertical: number };
  /** How tall it may get, as a fraction of the screen. */
  maxHeightRatio: number;
  /**
   * How far down a drag has to go before letting go dismisses it, as a
   * fraction of the sheet's own height.
   */
  dismissRatio: number;
  /**
   * Downward speed, in points per millisecond, that dismisses whatever
   * the distance was. A flick is an intention even when it is short.
   */
  dismissVelocity: number;
  elevation: ElevationStyle;
}

export interface IconButtonTokens {
  radius: RadiusScale;
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
    Select?: {
      defaults?: Record<string, unknown>;
      tokens?: SelectTokens;
    };
    Snackbar?: {
      defaults?: Record<string, unknown>;
      tokens?: SnackbarTokens;
    };
    BottomSheet?: {
      defaults?: Record<string, unknown>;
      tokens?: BottomSheetTokens;
    };
    Modal?: {
      defaults?: Record<string, unknown>;
      tokens?: ModalTokens;
    };
    Stack?: {
      defaults?: Record<string, unknown>;
      tokens?: StackTokens;
    };
    RadioGroup?: {
      defaults?: Record<string, unknown>;
      tokens?: RadioGroupTokens;
    };
    Switch?: {
      defaults?: Record<string, unknown>;
      tokens?: SwitchTokens;
    };
    Checkbox?: {
      defaults?: Record<string, unknown>;
      tokens?: CheckboxTokens;
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
    ListItem?: {
      defaults?: Record<string, unknown>;
      tokens?: ListItemTokens;
    };
    Divider?: {
      defaults?: Record<string, unknown>;
      tokens?: DividerTokens;
    };
    Avatar?: {
      defaults?: Record<string, unknown>;
      tokens?: AvatarTokens;
    };
    Badge?: {
      defaults?: Record<string, unknown>;
      tokens?: BadgeTokens;
    };
  }
}

/** @internal The floor every touch target has to clear, in points. */
/** The steps, lifted out of the semantic tier where the roles also live. */
const radiusSteps = (s: SemanticTokens): RadiusScale => ({
  none: s.radius.none,
  sm: s.radius.sm,
  md: s.radius.md,
  lg: s.radius.lg,
  xl: s.radius.xl,
  xxl: s.radius.xxl,
  full: s.radius.full,
});

const TOUCH_TARGET = 44;

/** The box itself is small; the target around it is not. */
const checkboxBoxes: SizeScale = { sm: 18, md: 20, lg: 24 };

/** Slightly larger than a checkbox: a circle reads smaller than a square of the same width. */
const radioCircles: SizeScale = { sm: 18, md: 22, lg: 26 };

/**
 * Track sizes. Roughly 1.75 to 1, which is the proportion at which a
 * pill reads as a track with room to travel rather than as a wide dot.
 */
const switchTracks = {
  sm: { w: 34, h: 20 },
  md: { w: 42, h: 24 },
  lg: { w: 52, h: 30 },
} as const;

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
        radius: radiusSteps(s),
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
        radius: radiusSteps(s),
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
        radius: radiusSteps(s),
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
        // 0.97 rather than something smaller: on a card the size of a
        // banner two percent is a few points of travel and reads as a
        // wobble, while three is unmistakable without being jumpy.
        pressScale: 0.97,
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
    Select: {
      tokens: {
        radius: radiusSteps(s),
        borderWidth: s.borderWidth.default,
        borderWidthFocused: s.borderWidth.strong,
        gap: 6,
        minHeight: fieldHeights,
        paddingHorizontal: { sm: 10, md: 12, lg: 14 },
        chevron: { size: 9, thickness: 2 },
        listMaxHeight: 360,
        typography: {
          label: s.typography.label,
          value: s.typography.body,
          helper: s.typography.caption,
        },
        color: {
          bg: s.surface.raised,
          bgDisabled: s.fill.subtle,
          border: s.border.default,
          borderOpen: s.border.focus,
          borderInvalid: s.action.danger.bg,
          borderDisabled: s.border.subtle,
          value: s.text.primary,
          placeholder: s.text.muted,
          valueDisabled: s.text.disabled,
          chevron: s.text.muted,
          label: s.text.primary,
          labelDisabled: s.text.disabled,
          helper: s.text.muted,
          helperInvalid: s.feedback.danger.fg,
          required: s.action.danger.bg,
        },
      } satisfies SelectTokens,
    },
    Snackbar: {
      tokens: {
        radius: s.radius.control,
        padding: 14,
        gap: s.space.inline,
        margin: s.space.inset,
        maxWidth: 560,
        // `floating` and not `modal`: it sits above the page but it is
        // not taking it over, and the shadow should say which.
        elevation: s.elevation.floating,
        typography: s.typography.bodySmall,
        reading: { base: 1600, perCharacter: 55, min: 3000, max: 7000 },
        color: {
          // Inverted, which is what a notification looks like on both
          // platforms: it is the app speaking, not a piece of the page.
          bg: s.surface.inverse,
          fg: s.text.inverse,
          // The action has to read against the inverted ground, so it
          // cannot be the primary role, which was chosen against the
          // page.
          action: s.text.inverse,
          bgSuccess: s.feedback.success.bg,
          bgWarning: s.feedback.warning.bg,
          bgDanger: s.feedback.danger.bg,
          bgInfo: s.feedback.info.bg,
          fgOnTone: s.text.primary,
        },
      } satisfies SnackbarTokens,
    },
    Divider: {
      tokens: {
        thickness: s.borderWidth.hairline,
        color: s.separator.default,
        spacing: {
          none: 0,
          sm: s.space.inline,
          md: s.space.stack,
          lg: s.space.section,
        },
        labelGap: s.space.stack,
        typography: { label: s.typography.caption },
        labelColor: s.text.muted,
      } satisfies DividerTokens,
    },
    Avatar: {
      tokens: {
        // Thumbnail, row, header, profile, portrait. The gaps widen
        // because the eye reads size logarithmically: two steps of four
        // points apart look like the same avatar twice.
        size: { xs: 24, sm: 32, md: 40, lg: 56, xl: 96 },
        fontSize: { xs: 10, sm: 13, md: 16, lg: 22, xl: 36 },
        iconSize: { xs: 14, sm: 18, md: 22, lg: 30, xl: 52 },
        radius: radiusSteps(s),
        fontWeight: '700',
        color: {
          // Not `fill.subtle`: in dark that is the same value as a
          // raised surface, and an avatar on a card would disappear.
          bg: s.fill.default,
          fg: s.text.secondary,
        },
      } satisfies AvatarTokens,
    },
    Badge: {
      tokens: {
        height: 18,
        minWidth: 18,
        paddingHorizontal: 6,
        radius: s.radius.full,
        dotSize: 8,
        typography: { label: s.typography.caption },
        tone: {
          primary: {
            solidBg: s.action.primary.bg,
            solidFg: s.action.primary.fg,
            softBg: s.action.primary.bgSubtlePressed,
            softFg: s.action.primary.fgSubtle,
          },
          // The neutral one. `fill.default` and not `subtle`, for the
          // same reason the avatar uses it: subtle equals a raised
          // surface in dark.
          secondary: {
            solidBg: s.action.secondary.bg,
            solidFg: s.action.secondary.fg,
            softBg: s.fill.default,
            softFg: s.text.secondary,
          },
          danger: {
            solidBg: s.action.danger.bg,
            solidFg: s.action.danger.fg,
            softBg: s.feedback.danger.bg,
            softFg: s.feedback.danger.fg,
          },
          success: {
            solidBg: s.action.success.bg,
            solidFg: s.action.success.fg,
            softBg: s.feedback.success.bg,
            softFg: s.feedback.success.fg,
          },
          warning: {
            solidBg: s.action.warning.bg,
            solidFg: s.action.warning.fg,
            softBg: s.feedback.warning.bg,
            softFg: s.feedback.warning.fg,
          },
        },
      } satisfies BadgeTokens,
    },
    ListItem: {
      tokens: {
        minHeight: TOUCH_TARGET,
        // Ten and not the inset: a row is a line of text with air around
        // it, and at sixteen a one-line row is taller than a button.
        paddingVertical: 10,
        paddingHorizontal: s.space.inset,
        gap: s.space.stack,
        titleGap: 2,
        iconSize: 22,
        chevron: { size: 8, thickness: s.borderWidth.strong },
        separator: {
          thickness: s.borderWidth.hairline,
          // The translucent one, which is what belongs between rows: it
          // takes the colour of whatever the list was dropped onto
          // instead of assuming a ground.
          color: s.separator.default,
          inset: s.space.inset + 22 + s.space.stack,
        },
        typography: {
          title: s.typography.body,
          subtitle: s.typography.bodySmall,
          value: s.typography.body,
        },
        color: {
          bg: 'transparent',
          // The same press the `Card` makes, so a row and a card that do
          // the same thing do not feel like two different libraries.
          bgPressed: s.surface.sunken,
          title: s.text.primary,
          subtitle: s.text.secondary,
          value: s.text.muted,
          icon: s.text.secondary,
          chevron: s.text.muted,
        },
      } satisfies ListItemTokens,
    },
    BottomSheet: {
      tokens: {
        scrim: s.overlay.scrim,
        bg: s.surface.overlay,
        radius: radiusSteps(s),
        padding: s.space.inset,
        gap: s.space.stack,
        handle: {
          width: 36,
          height: 4,
          color: s.fill.strong,
          marginVertical: 8,
        },
        maxHeightRatio: 0.9,
        dismissRatio: 0.25,
        dismissVelocity: 0.5,
        elevation: s.elevation.modal,
      } satisfies BottomSheetTokens,
    },
    Modal: {
      tokens: {
        scrim: s.overlay.scrim,
        // `overlay` and not `raised`: the panel floats above everything
        // rather than sitting on the page, and in dark mode those are
        // two different values for a reason.
        bg: s.surface.overlay,
        radius: s.radius.surface,
        margin: s.space.inset,
        padding: s.space.inset,
        gap: s.space.stack,
        maxWidth: { sm: 320, md: 420, lg: 560 },
        maxHeightRatio: 0.85,
        elevation: s.elevation.modal,
      } satisfies ModalTokens,
    },
    Stack: {
      tokens: {
        gap: {
          none: 0,
          inline: s.space.inline,
          stack: s.space.stack,
          inset: s.space.inset,
          section: s.space.section,
        },
        // The opaque separator, like a card's: a stack usually sits on a
        // surface, and letting the page show through a line drawn on one
        // is the wrong effect.
        divider: s.separator.opaque,
        dividerWidth: s.borderWidth.hairline,
      } satisfies StackTokens,
    },
    RadioGroup: {
      tokens: {
        circle: radioCircles,
        dot: { sm: 8, md: 10, lg: 12 },
        borderWidth: s.borderWidth.strong,
        gap: s.space.inline,
        optionGap: 10,
        groupGap: s.space.stack,
        hitSlop: hitSlopFor(radioCircles),
        typography: {
          legend: s.typography.label,
          label: s.typography.body,
          helper: s.typography.caption,
        },
        color: {
          bg: s.surface.raised,
          bgDisabled: s.fill.subtle,
          border: s.border.default,
          borderChecked: s.action.primary.bg,
          borderInvalid: s.action.danger.bg,
          borderDisabled: s.border.subtle,
          dot: s.action.primary.bg,
          dotDisabled: s.text.disabled,
          legend: s.text.primary,
          label: s.text.primary,
          labelDisabled: s.text.disabled,
          helper: s.text.muted,
          helperInvalid: s.feedback.danger.fg,
          required: s.action.danger.bg,
        },
      } satisfies RadioGroupTokens,
    },
    Switch: {
      tokens: {
        track: switchTracks,
        thumb: { sm: 16, md: 20, lg: 24 },
        inset: { sm: 2, md: 2, lg: 3 },
        gap: s.space.inline,
        rowGap: 6,
        hitSlop: hitSlopFor({
          sm: switchTracks.sm.h,
          md: switchTracks.md.h,
          lg: switchTracks.lg.h,
        }),
        duration: s.motion.quick,
        elevation: s.elevation.raised,
        typography: { label: s.typography.body, helper: s.typography.caption },
        color: {
          // The track off is a fill and not a surface: it is a rail, not
          // a card, and Apple's fill scale exists for exactly this.
          trackOff: s.fill.default,
          trackOn: s.action.primary.bg,
          trackOffDisabled: s.fill.subtle,
          trackOnDisabled: s.fill.strong,
          trackInvalid: s.action.danger.bg,
          thumb: '#ffffff',
          thumbDisabled: s.surface.raised,
          label: s.text.primary,
          labelDisabled: s.text.disabled,
          helper: s.text.muted,
          helperInvalid: s.feedback.danger.fg,
          required: s.action.danger.bg,
        },
      } satisfies SwitchTokens,
    },
    Checkbox: {
      tokens: {
        // Softer than a control but not a pill: a square with rounded
        // corners is what says "more than one of these may be true",
        // which is the whole difference from a radio.
        radius: 5,
        borderWidth: s.borderWidth.strong,
        box: checkboxBoxes,
        gap: s.space.inline,
        rowGap: 6,
        hitSlop: hitSlopFor(checkboxBoxes),
        markWidth: { sm: 1.5, md: 2, lg: 2.5 },
        typography: { label: s.typography.body, helper: s.typography.caption },
        color: {
          bg: s.surface.raised,
          bgChecked: s.action.primary.bg,
          bgDisabled: s.fill.subtle,
          bgCheckedDisabled: s.fill.default,
          border: s.border.default,
          borderChecked: s.action.primary.bg,
          borderInvalid: s.action.danger.bg,
          borderDisabled: s.border.subtle,
          mark: s.action.primary.fg,
          markDisabled: s.text.disabled,
          label: s.text.primary,
          labelDisabled: s.text.disabled,
          helper: s.text.muted,
          helperInvalid: s.feedback.danger.fg,
          required: s.action.danger.bg,
        },
      } satisfies CheckboxTokens,
    },
    IconButton: {
      tokens: {
        radius: radiusSteps(s),
        borderWidth: s.borderWidth.default,
        size: iconButtonSizes,
        iconSize: { sm: 18, md: 20, lg: 24 },
        hitSlop: hitSlopFor(iconButtonSizes),
        role,
      } satisfies IconButtonTokens,
    },
  };
}
