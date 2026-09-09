import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/**
 * The steps a sheet's top corners can take.
 *
 * The whole radius scale except `'full'`, which a sheet cannot honour:
 * a pill needs a short dimension and the sheet's width is its long one,
 * so `'full'` resolves to a dome that curves out from under the text.
 * Every step that renders as a corner is here.
 */
export type BottomSheetRadius = Exclude<RadiusStep, 'full'>;

/** Per-slot style overrides. */
export interface BottomSheetSx {
  /** The darkened page behind the sheet. */
  scrim?: StyleProp<ViewStyle>;
  /** The sheet itself. */
  sheet?: StyleProp<ViewStyle>;
  /** The grabber. */
  handle?: StyleProp<ViewStyle>;
}

export interface BottomSheetProps extends DashforgeProps {
  /** Whether the sheet is up. */
  open: boolean;
  /**
   * Asked to close.
   *
   * Called by the scrim, by Android's back button and by a drag that
   * went far enough or fast enough. Never by the component on its own:
   * as with `Modal`, the caller keeps the state that says whether it is
   * open, so a sheet that must not close simply is not told to.
   */
  onClose?: () => void;
  /**
   * Whether the scrim, the back button and the drag may close it.
   *
   * With `false` the sheet still moves under the finger and springs
   * back, which is the honest feedback: it says "this can be dragged and
   * will not go away" rather than pretending not to be a sheet.
   *
   * @default true
   */
  dismissible?: boolean;
  /**
   * What the drag starts from.
   *
   * `'handle'` is the default and the safe one: only the grabber and the
   * strip around it respond, so anything scrollable inside keeps its own
   * gestures and there is nothing to arbitrate.
   *
   * `'anywhere'` makes the whole sheet a drag target, which feels better
   * for short content and **fights any scroll view inside it**: React
   * Native gives the first responder the gesture, and a sheet that took
   * it will not give it back mid-drag. Use it when the content does not
   * scroll.
   *
   * @default 'handle'
   */
  dragFrom?: 'handle' | 'anywhere';
  /**
   * How rounded the two top corners are, named from the radius scale.
   * The bottom two never round: they are against the screen's edge.
   *
   * Square by default. A sheet is already separated from the page by
   * the scrim and by its own ground, so the rounding is decoration
   * rather than information, and decoration is the caller's call. Every
   * step up to `'xxl'` is available for a design that wants the soft
   * arriving-from-the-edge look.
   *
   * @default 'none'
   */
  radius?: BottomSheetRadius;
  /**
   * Show the grabber.
   *
   * Turning it off with `dragFrom: 'handle'` leaves a sheet that can be
   * dragged with nothing saying so, which is why it warns in
   * development.
   *
   * @default true
   */
  showHandle?: boolean;
  /**
   * The heights the sheet settles at, as fractions of the screen,
   * strictly ascending. `[0.4, 0.9]` is a sheet that opens at two fifths
   * and pulls up to nine tenths.
   *
   * Without this the sheet is as tall as its content and the drag only
   * goes one way, down. With it the sheet can be resized: it is laid out
   * once at the tallest detent and a smaller one slides the rest below
   * the screen's edge, so a drag moves a single value and never
   * re-lays-out per frame.
   *
   * **The content is then anchored to the top.** At a partial detent the
   * sheet's own bottom is off-screen, and so are `bottomInset` and any
   * `Card.Footer`. A sheet that snaps holds a list; a sheet that holds a
   * footer does not snap.
   *
   * The resize is dragged from whatever `dragFrom` names, which for the
   * default means the handle. Pulling up on a list inside the sheet
   * scrolls the list, because React Native gives that gesture to the
   * scroll view and does not take it back.
   *
   * @default undefined
   */
  snapPoints?: number[];
  /**
   * Which detent it opens at, as an index into `snapPoints`. It returns
   * here every time it opens: the detent the user left it at was an
   * answer to the last visit.
   * @default 0
   */
  initialSnap?: number;
  /**
   * Told when the sheet settles on a different detent, by drag or by
   * assistive technology.
   *
   * Unlike `onClose` this is a notification and not a request: which
   * detent the sheet is at is not business state, so the component keeps
   * it. Use this to change what the content shows at each height.
   *
   * @default undefined
   */
  onSnapChange?: (index: number) => void;
  /**
   * How far off the bottom edge the content sits. The safe-area inset
   * goes here; this package has no dependency that could read it.
   * @default 0
   */
  bottomInset?: number;
  /**
   * The sheet's name for assistive technology. Give it the same words as
   * the heading.
   * @default undefined
   */
  label?: string;
  /**
   * The content. `Card.Header` and `Card.Footer` work inside, because a
   * sheet's heading is a card's heading.
   */
  children?: ReactNode;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: BottomSheetSx;
}
