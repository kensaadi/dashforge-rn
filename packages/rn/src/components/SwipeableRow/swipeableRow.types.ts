import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { ActionColor } from '../../tokens/components';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** One thing a swipe reveals. */
export interface SwipeAction {
  /** Identity, for React and for nothing else. */
  key: string;
  /** The word under the icon. Keep it to one. */
  label: string;
  /**
   * Drawn above the label, at the token size and in the action's own
   * foreground colour.
   * @default undefined
   */
  icon?: IconComponent;
  /**
   * The role, from the same five every action in this library uses.
   * @default 'secondary'
   */
  color?: ActionColor;
  /** What it does. The row closes on its own afterwards. */
  onPress: () => void;
}

/** Per-slot style overrides. */
export interface SwipeableRowSx {
  /** The clipping box around everything. */
  root?: StyleProp<ViewStyle>;
  /** The layer that travels under the finger. */
  content?: StyleProp<ViewStyle>;
  /** One action's box. */
  action?: StyleProp<ViewStyle>;
  /** One action's word. */
  actionLabel?: StyleProp<TextStyle>;
}

export interface SwipeableRowProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /** The row. Usually a `ListItem`. */
  children?: ReactNode;
  /**
   * Revealed by swiping left, which is where a destructive action goes
   * on both platforms.
   * @default undefined
   */
  rightActions?: SwipeAction[];
  /**
   * Revealed by swiping right.
   * @default undefined
   */
  leftActions?: SwipeAction[];
  /**
   * Told when the row opens or closes, for a caller that has to know.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SwipeableRowSx;
}
