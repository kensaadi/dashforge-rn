import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface KeyboardAvoidingContainerSx {
  /** The container that gets out of the keyboard's way. */
  root?: StyleProp<ViewStyle>;
  /** The scrolling content inside it, when it scrolls. */
  content?: StyleProp<ViewStyle>;
}

export interface KeyboardAvoidingContainerProps extends DashforgeProps {
  /** The screen. */
  children?: ReactNode;
  /**
   * How much room to leave above the keyboard, on top of the keyboard
   * itself.
   *
   * The number to put here is the height of whatever sits above this
   * container and does not move: a header, a navigation bar. Without it
   * the field ends up exactly that far under the keyboard, which is the
   * single most common way this component is reported as broken.
   *
   * @default 0
   */
  offset?: number;
  /**
   * Whether it scrolls.
   *
   * On by default, because a screen that needs to get out of the
   * keyboard's way is a screen taller than what is left of the phone.
   * Turn it off when the caller owns the scrolling, a `FlatList` or a
   * `SurfaceViewport`, and give that scroll view
   * `keyboardShouldPersistTaps="handled"` itself or every button on it
   * will need two taps while the keyboard is up.
   *
   * @default true
   */
  scroll?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: KeyboardAvoidingContainerSx;
}
