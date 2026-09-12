import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** What an item's value may be. */
export type AccordionValue = string | number;

/** Per-slot style overrides on the group. */
export interface AccordionSx {
  /** The column of items. */
  root?: StyleProp<ViewStyle>;
}

/** Per-slot style overrides on one item. */
export interface AccordionItemSx {
  /** The item, header and panel together. */
  root?: StyleProp<ViewStyle>;
  /** The pressable row. */
  header?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  subtitle?: StyleProp<TextStyle>;
  /** The mark that turns. */
  chevron?: StyleProp<ViewStyle>;
  /** The box that grows. */
  panel?: StyleProp<ViewStyle>;
  /** The hairline above the item. */
  separator?: StyleProp<ViewStyle>;
}

export interface AccordionProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /** The items. */
  children?: ReactNode;
  /**
   * Whether more than one can be open.
   *
   * `single` closes the others, which is what a list of questions wants:
   * one answer on screen and the rest within reach. `multiple` leaves
   * that to the reader, which is what a set of filters wants.
   *
   * @default 'single'
   */
  type?: 'single' | 'multiple';
  /** Controlled: which items are open. Always an array, in both types. */
  value?: AccordionValue[];
  /**
   * Uncontrolled initial state.
   * @default []
   */
  defaultValue?: AccordionValue[];
  /**
   * Told when what is open changes.
   * @default undefined
   */
  onValueChange?: (value: AccordionValue[]) => void;
  /**
   * Draw a hairline between one item and the next.
   * @default true
   */
  divider?: boolean;
  /**
   * Disables every item at once.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: AccordionSx;
}

export interface AccordionItemProps extends DashforgeProps {
  /** Identity, and what `value` on the group refers to. */
  value: AccordionValue;
  /**
   * The question. A bare string is wrapped for you; React Native would
   * crash on it.
   */
  title: ReactNode;
  /**
   * A second line under it, for what the title does not say.
   * @default undefined
   */
  subtitle?: ReactNode;
  /**
   * Drawn before the title, at the title's own colour.
   * @default undefined
   */
  icon?: IconComponent;
  /** The answer. */
  children?: ReactNode;
  /**
   * Inert on its own, whatever the group says.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: AccordionItemSx;
}
