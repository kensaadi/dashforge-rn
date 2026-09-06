import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface ModalSx {
  /** The darkened page behind the panel. */
  scrim?: StyleProp<ViewStyle>;
  /** The panel itself. */
  panel?: StyleProp<ViewStyle>;
}

export interface ModalProps extends DashforgeProps {
  /** Whether the dialog is on screen. */
  open: boolean;
  /**
   * Asked to close.
   *
   * Called by the scrim and by Android's back button, and never by the
   * component on its own: the dialog does not close itself, so the
   * caller keeps the one piece of state that says whether it is open.
   */
  onClose?: () => void;
  /**
   * Whether the scrim and the back button may close it.
   *
   * `false` for a dialog that has to be answered, and it is worth
   * meaning it: a dialog with no way out but a button is a dialog that
   * has to be worth the interruption.
   *
   * @default true
   */
  dismissible?: boolean;
  /**
   * How wide the panel may become. A phone reaches the screen margin
   * before any of these, so this is about tablets.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The dialog's name for assistive technology.
   *
   * Give it the same words as the heading. Without one, a screen reader
   * announces that a dialog opened and then nothing about which.
   * @default undefined
   */
  label?: string;
  /**
   * The panel's content. `Modal.Header` and `Modal.Footer` are Card's
   * own, so a dialog is composed the way a card is.
   */
  children?: ReactNode;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: ModalSx;
}
