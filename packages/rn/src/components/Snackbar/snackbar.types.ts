import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { DialogKind } from '../Modal/dialog.types';

/** The one thing a notification may offer to do about itself. */
export interface NotificationAction<V extends string = string> {
  /** Returned by `notify` when it is pressed. */
  value: V;
  label: string;
}

/**
 * Something to tell, as data.
 *
 * The counterpart of `Question`, and the opposite on every rule that
 * matters: it does not block, it does not wait for an answer, it goes
 * away by itself, and two of them queue rather than being a defect.
 */
export interface Notification<A extends NotificationAction | undefined = undefined> {
  message: string;
  /**
   * Tints the ground. `neutral` is the inverted one, which is what a
   * notification looks like on both platforms.
   * @default 'neutral'
   */
  kind?: DialogKind;
  /**
   * One thing to do about it, usually an undo. One and not several: a
   * notification is not a decision, and a row of choices that vanishes
   * on a timer is a decision you can lose by reading slowly.
   * @default undefined
   */
  action?: A;
  /**
   * How long it stays, in milliseconds.
   *
   * Worked out from the length of the message when it is not given,
   * because a fixed duration is wrong at both ends: three seconds is
   * plenty for "Salvato" and not enough for a sentence.
   *
   * @default computed from the message
   */
  duration?: number;
}

/** Per-slot style overrides. */
export interface SnackbarSx {
  root?: StyleProp<ViewStyle>;
  message?: StyleProp<TextStyle>;
  action?: StyleProp<TextStyle>;
}

export interface SnackbarProps {
  message: string;
  /** @default 'neutral' */
  kind?: DialogKind;
  /** @default undefined */
  actionLabel?: string;
  /** @default undefined */
  onAction?: () => void;
  /**
   * How far off the bottom edge it sits. The safe-area inset goes here;
   * this package has no dependency that could read it for you.
   * @default 0
   */
  offset?: number;
  /** @default undefined */
  sx?: SnackbarSx;
}
