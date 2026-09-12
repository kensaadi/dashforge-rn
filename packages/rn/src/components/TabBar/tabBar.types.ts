import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** What an item's value may be. */
export type TabBarValue = string | number;

/** One destination on the bar. */
export interface TabBarItem {
  /** What comes back when it is pressed. */
  value: TabBarValue;
  /** The word under the icon. One, and short. */
  label: string;
  /** Drawn above the word, at the word's own colour. */
  icon?: IconComponent;
  /**
   * A count on the icon. Pass a `Badge`; the bar only makes room.
   * @default undefined
   */
  badge?: ReactNode;
  /**
   * Inert on its own.
   * @default false
   */
  disabled?: boolean;
}

/** Per-slot style overrides. */
export interface TabBarSx {
  /** The bar, inset and all. */
  root?: StyleProp<ViewStyle>;
  /** The row of items. */
  row?: StyleProp<ViewStyle>;
  /** One item. */
  item?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

export interface TabBarProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /** The destinations, three to five. */
  items: TabBarItem[];
  /** Which one is current. */
  value: TabBarValue;
  /**
   * Told which one was pressed.
   *
   * **It does not navigate.** The bar renders; what a press means is
   * the caller's, because the navigator is theirs.
   *
   * @default undefined
   */
  onValueChange?: (value: TabBarValue) => void;
  /**
   * How far up from the bottom edge it sits. The safe-area inset goes
   * here; this package has no dependency that could read it.
   * @default 0
   */
  bottomInset?: number;
  /**
   * What assistive technology calls the set.
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: TabBarSx;
}
