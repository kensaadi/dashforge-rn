import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface DividerSx {
  /** The wrapper, which is what carries the spacing. */
  root?: StyleProp<ViewStyle>;
  /** The hairline itself, or each of the two when there is a label. */
  line?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

export interface DividerProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * Which way it runs.
   *
   * A vertical divider has no height of its own: it stretches to the row
   * it is in, which means the row has to have a height for it to take.
   * Inside a `Stack direction="row"` that happens on its own.
   *
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * How much air it keeps around itself, on the axis it divides.
   * @default 'md'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Words in the break, for the "oppure" between two ways of doing the
   * same thing. Horizontal only: there is no room for a word in a
   * vertical rule, and a rotated one is not a design, it is a trick.
   *
   * @default undefined
   */
  label?: ReactNode;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: DividerSx;
}
