import type { ComponentType, ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { ActionColor } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/**
 * The state a `sx` function receives.
 *
 * No `hovered`: hover does not exist on a touch device. If react-native-web
 * is ever supported that is a separate, deliberate decision.
 */
export interface DashPressState {
  pressed: boolean;
  focused: boolean;
  disabled: boolean;
}

/**
 * An icon, passed as the **component** rather than as an element, so the
 * library can size and colour it for the variant and size in play. Any
 * icon set whose components accept `size` and `color` fits, which is the
 * de facto standard: lucide, phosphor, and the rest.
 */
export type IconComponent = ComponentType<{ size?: number; color?: string }>;

export interface ButtonProps
  extends Omit<PressableProps, 'style' | 'children' | 'disabled'>, DashforgeProps {
  /** The label. A bare string is wrapped for you; React Native would crash on it. */
  children?: ReactNode;
  /**
   * Visual treatment.
   * @default 'solid'
   */
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  /**
   * Semantic role. `secondary` is deliberately neutral rather than a
   * second brand hue.
   * @default 'primary'
   */
  color?: ActionColor;
  /**
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Stretch to the width of the parent. The content stays centred as a
   * group rather than spreading to the edges.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Blocks presses and announces itself as busy, but keeps the button's
   * full colour: loading is not the same message as unavailable, and the
   * two must not look alike.
   * @default false
   */
  loading?: boolean;
  /**
   * @default false
   */
  disabled?: boolean;
  /**
   * Icon before the label. While `loading`, the spinner takes its place
   * rather than adding to it, so the button does not change width
   * mid-interaction.
   */
  startIcon?: IconComponent;
  /** Icon after the label. */
  endIcon?: IconComponent;
  /**
   * Style override. Targets the button itself; the label follows the
   * type token and the `color` role. Always applied last, so it wins.
   *
   * The function form receives the live interaction state, which is the
   * only way to reach the pressed appearance from the outside.
   */
  sx?: StyleProp<ViewStyle> | ((state: DashPressState) => StyleProp<ViewStyle>);
}
