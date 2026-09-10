import type { DimensionValue, StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface SkeletonSx {
  /** The block. */
  root?: StyleProp<ViewStyle>;
}

export interface SkeletonProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * How wide. A raw value on purpose: a skeleton is the shape of the
   * content it stands in for, and that shape is not on any scale.
   * @default '100%'
   */
  width?: DimensionValue;
  /**
   * How tall.
   * @default the line height from the tokens
   */
  height?: DimensionValue;
  /**
   * How rounded, named from the radius scale. `full` plus equal width
   * and height is the stand-in for an avatar.
   * @default 'sm'
   */
  radius?: RadiusStep;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SkeletonSx;
}

/** Per-slot style overrides. */
export interface SkeletonTextSx {
  /** The column of lines. */
  root?: StyleProp<ViewStyle>;
  /** Each line. */
  line?: StyleProp<ViewStyle>;
}

export interface SkeletonTextProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * How many lines to stand in for.
   * @default 3
   */
  lines?: number;
  /**
   * How wide the last one is. A paragraph does not end at the right
   * margin, and a stack of identical bars does not read as text.
   * @default '60%'
   */
  lastWidth?: DimensionValue;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SkeletonTextSx;
}
