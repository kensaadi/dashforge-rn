import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { ActionColor } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface SpinnerSx {
  /** The ring. */
  root?: StyleProp<ViewStyle>;
}

export interface SpinnerProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * How big. `sm` fits a button's label line, `md` a card, `lg` a page.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The role, from the same five every action in this library uses.
   * `secondary` is the neutral one.
   * @default 'primary'
   */
  color?: ActionColor;
  /**
   * An explicit colour, for a spinner inside something that has already
   * decided what colour its contents are: a `Button`'s label sits on the
   * button's own fill, and no role token knows that. Wins over `color`.
   *
   * @default undefined
   */
  tint?: string;
  /**
   * What assistive technology reads.
   *
   * Without one it is still announced as busy, which is what a spinner
   * is, but not what it is waiting for. Give it words whenever the
   * surrounding screen does not already say.
   *
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SpinnerSx;
}
