import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ActionColor } from '../../tokens/components';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface FABSx {
  /** The button. */
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

export interface FABProps extends DashforgeProps {
  /** The mark on it. A plus, a pencil. */
  icon: IconComponent;
  /**
   * What assistive technology reads. **Required**: a button with a plus
   * on it and nothing else is announced as nothing at all.
   */
  accessibilityLabel: string;
  /**
   * A word beside the icon, which turns the circle into a pill. For the
   * one action a screen is really about.
   * @default undefined
   */
  label?: string;
  /** What it does. */
  onPress?: () => void;
  /**
   * Where it sits. `none` takes it out of the corner and leaves the
   * placing to whatever it was put in, which is what a caller with
   * their own layout wants.
   * @default 'bottom-end'
   */
  position?: 'bottom-end' | 'bottom-start' | 'none';
  /**
   * How far up from the bottom edge. The safe-area inset goes here, plus
   * the height of anything it must clear, a `TabBar` for instance.
   * @default 0
   */
  bottomInset?: number;
  /**
   * The role, from the same five every action in this library uses.
   * @default 'primary'
   */
  color?: ActionColor;
  /**
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Inert and dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: FABSx;
}
