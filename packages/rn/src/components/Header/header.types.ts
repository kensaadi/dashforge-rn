import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface HeaderSx {
  /** The bar, inset and all. */
  root?: StyleProp<ViewStyle>;
  /** The row inside it. */
  row?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  subtitle?: StyleProp<TextStyle>;
  /** The arrow that goes back. */
  back?: StyleProp<ViewStyle>;
}

export interface HeaderProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * What screen this is. A bare string is wrapped for you and announced
   * as a heading; React Native would crash on it otherwise.
   * @default undefined
   */
  title?: ReactNode;
  /**
   * A second line under it.
   * @default undefined
   */
  subtitle?: ReactNode;
  /**
   * Draws the arrow and is told when it is pressed.
   *
   * **It does not go back.** This bar renders; navigation belongs to
   * react-navigation, and the caller is the one holding the navigator.
   *
   * @default undefined
   */
  onBack?: () => void;
  /**
   * What the arrow is called.
   * @default 'Indietro'
   */
  backLabel?: string;
  /**
   * Put instead of the arrow. A menu button, an avatar.
   * @default undefined
   */
  leading?: ReactNode;
  /**
   * Put at the end. One or two `IconButton`s, no more: a bar with four
   * actions is a bar nobody reads.
   * @default undefined
   */
  actions?: ReactNode;
  /**
   * How far down the bar starts. The safe-area inset goes here; this
   * package has no dependency that could read it.
   * @default 0
   */
  topInset?: number;
  /**
   * Put the title in the middle rather than against the leading edge.
   * Centred is the iOS look and against the edge is the Android one,
   * and the choice is the caller's rather than the platform's, because
   * appearance is ours on both.
   *
   * @default false
   */
  centerTitle?: boolean;
  /**
   * Draw the hairline along the bottom edge.
   * @default true
   */
  divider?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: HeaderSx;
}
