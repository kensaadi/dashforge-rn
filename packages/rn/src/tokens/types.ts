/**
 * Tier 2 and tier 3 token shapes.
 *
 * The semantic tier is the only one that swaps between light and dark,
 * so every field here must have a meaningful value in both. If a token
 * only makes sense in one mode, it is named wrong.
 *
 * See ARCHITECTURE.md section 6.
 */

/** An action role: the fill, its pressed and disabled states, and what sits on it. */
export interface ActionRole {
  /** Resting fill. */
  bg: string;
  /** Fill while the control is held. Never an opacity: a press is a colour. */
  bgPressed: string;
  /** Fill when the control is disabled. */
  bgDisabled: string;
  /** Label and icon colour on top of `bg`. */
  fg: string;
  /** Label and icon colour on top of `bgDisabled`. */
  fgDisabled: string;
  /** Border colour, for outlined treatments of the same role. */
  border: string;
  /**
   * The role's colour used as a *label on a surface*, for the `outline`,
   * `ghost` and `link` treatments. Not the same value as `bg`: a fill
   * only has to carry white text, while a label has to be legible
   * against the page, which pulls it deeper on light and lighter on
   * dark.
   */
  fgSubtle: string;
  /**
   * The tint that appears under a `ghost` treatment while it is held.
   * A ghost has no fill to deepen, so the press grows one rather than
   * dimming the label: dimming already means disabled, and two states
   * that look the same are two states the user cannot tell apart.
   */
  bgSubtlePressed: string;
  /**
   * Label colour while held, for treatments with no fill at all (`link`
   * inside flowing text). It moves *away* from the background, darker on
   * a light ground and lighter on a dark one, which is the same rule the
   * fills follow.
   */
  fgPressed: string;
}

/** A feedback role: a tinted surface, its text, and its edge. */
export interface FeedbackRole {
  /** Tinted background for banners, alerts and badges. */
  bg: string;
  /** Text and icon colour on that background. */
  fg: string;
  /** Edge of the tinted region. */
  border: string;
}

/**
 * One entry of the type scale. Family, size, weight and line height move
 * together, because in practice they are never chosen separately.
 */
export interface TypeStyle {
  /** `undefined` means the platform system face (SF on iOS, Roboto on Android). */
  fontFamily?: string;
  fontSize: number;
  /**
   * Line height as a **ratio of the font size**, not an absolute value.
   *
   * React Native scales `fontSize` when the user raises the system text
   * size but leaves `lineHeight` alone, so an absolute 24 against a
   * doubled 16pt body produces overlapping lines: broken precisely for
   * the reader who needed the setting. The theme layer resolves this to
   * an absolute number, multiplied by `PixelRatio.getFontScale()`.
   */
  lineHeight: number;
  /**
   * Only three weights exist.
   *
   * Roboto ships Regular (400), Medium (500) and Bold (700) and has **no
   * 600**. SF on iOS does. A `'600'` token would therefore render
   * semibold on one platform and either medium or bold on the other:
   * one token, two appearances, which is the thing section 3 forbids.
   */
  fontWeight: '400' | '500' | '700';
  letterSpacing?: number;
  /**
   * Ceiling on the user's text-size setting, as a safety net only.
   *
   * `undefined` means the role scales freely, which is correct for
   * reading text and is the whole point of the accessibility feature.
   * Roles that live inside controls carry a cap so an extreme setting
   * cannot destroy a layout, but the primary defence is that controls
   * size with `minHeight` and grow, rather than clipping.
   */
  maxFontSizeMultiplier?: number;
}

/**
 * One elevation step, expressed once and expanded to both platforms.
 * iOS reads the `shadow*` fields; Android reads `elevation`, which also
 * affects stacking order and not only the shadow.
 */
export interface ElevationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/** Tier 2. The layer that carries meaning, and the only one that swaps by mode. */
export interface SemanticTokens {
  surface: {
    /** The page. */
    base: string;
    /** A card or sheet sitting on the page. */
    raised: string;
    /** A well, an input field, a recessed region. */
    sunken: string;
    /** A surface floating above everything (menu, popover). */
    overlay: string;
    /** A surface that inverts against the mode, for contrast moments. */
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    /** Text on `surface.inverse`. */
    inverse: string;
    /** Text on a saturated accent fill. */
    onAccent: string;
  };
  border: {
    /** Hairline separators inside a surface. */
    subtle: string;
    /** The default edge of a control or card. */
    default: string;
    /** A deliberate emphasis edge. */
    strong: string;
    /** The focus ring. */
    focus: string;
  };
  /**
   * Fills for non-text elements that are not actions: a progress track,
   * a skeleton, a slider rail, an unselected segment.
   *
   * Borrowed from Apple's fill hierarchy, which exists because these
   * needed their own scale rather than borrowing the text or border one
   * and drifting.
   */
  fill: {
    subtle: string;
    default: string;
    strong: string;
  };
  /**
   * Two separators, following Apple.
   *
   * `separator` is translucent and lets whatever is behind it show
   * through, which is what you want between rows of a list. `opaque` is
   * solid and is what you want where content must not bleed through,
   * such as the edge of a bar sitting over scrolling content.
   */
  separator: {
    default: string;
    opaque: string;
  };
  action: {
    primary: ActionRole;
    /** Deliberately neutral rather than a second brand hue. */
    secondary: ActionRole;
    danger: ActionRole;
    success: ActionRole;
    warning: ActionRole;
  };
  feedback: {
    success: FeedbackRole;
    warning: FeedbackRole;
    danger: FeedbackRole;
    info: FeedbackRole;
  };
  /** The dim behind a modal or sheet. */
  overlay: { scrim: string };

  radius: {
    /**
     * The steps, and the three roles below are aliases into them rather
     * than numbers of their own: one set of values, so a role and a step
     * cannot drift apart.
     *
     * **The scale is this library's**, chosen for React Native rather
     * than borrowed from anywhere. The steps run on a four-point rhythm
     * because that is what the spacing scale runs on and what reads
     * evenly in density-independent points: 4, 8, 12, 16, 24. `control`
     * lands on `md` and `surface` on `lg` because a container should be
     * softer than the things inside it, and one step is exactly how much
     * softer.
     *
     * The web packages have their own scales for their own reasons, and
     * whether any of them agrees with this one is not a constraint on
     * it. A token arriving from a design tool is transformed into these,
     * which is the job of a token layer.
     */
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    /** As round as the box allows. */
    full: number;

    /** Buttons, fields, chips. The same value as `md`. */
    control: number;
    /** Cards, sheets, modals, softer than their contents. The same as `lg`. */
    surface: number;
    /** Avatars, badges, anything fully round. The same as `full`. */
    pill: number;
  };
  borderWidth: {
    hairline: number;
    default: number;
    strong: number;
  };
  space: {
    /** Between items on one line. */
    inline: number;
    /** Between stacked items. */
    stack: number;
    /** Padding inside a control or card. */
    inset: number;
    /** Between sections of a screen. */
    section: number;
  };
  /**
   * Control heights, applied as **`minHeight` and never `height`**, so a
   * control grows when the user's text-size setting demands it instead
   * of clipping its own label.
   *
   * The 44pt minimum touch target is a separate floor: `sm` sits below
   * it visually and recovers it with `hitSlop`, never by growing.
   */
  control: {
    minHeight: { sm: number; md: number; lg: number };
  };
  elevation: {
    /** No shadow. The default, in a flat-and-bordered language. */
    flat: ElevationStyle;
    /** A card that wants separating from the page. Used sparingly. */
    raised: ElevationStyle;
    /** Menus and popovers. */
    floating: ElevationStyle;
    /** Modals and bottom sheets. */
    modal: ElevationStyle;
  };
  typography: {
    display: TypeStyle;
    title: TypeStyle;
    subtitle: TypeStyle;
    body: TypeStyle;
    /** The second line of a list item. `body` to `caption` is too wide a jump. */
    bodySmall: TypeStyle;
    label: TypeStyle;
    caption: TypeStyle;
    mono: TypeStyle;
  };
  opacity: {
    /**
     * The only opacity token, and deliberately so. Dimming means
     * "unavailable" and nothing else; a press is always a colour change.
     */
    disabled: number;
  };
  motion: {
    instant: number;
    quick: number;
    standard: number;
    deliberate: number;
  };
  zIndex: {
    base: number;
    sticky: number;
    overlay: number;
    modal: number;
    toast: number;
  };
}

/**
 * Tier 3. Intentionally empty: each component augments it by declaration
 * merging when it lands, so untyped consumers still compile and
 * `theme.components` autocompletes at zero runtime cost.
 *
 * @example
 * ```ts
 * declare module '@dashforge/rn/tokens' {
 *   interface ComponentTokens {
 *     Button?: {
 *       defaults?: Partial<ButtonVariantProps>;
 *       tokens?: ButtonTokens;
 *     };
 *   }
 * }
 * ```
 */

export interface ComponentTokens {}

/** Which of the two shipped modes a theme represents. */
export type ThemeMode = 'light' | 'dark';
