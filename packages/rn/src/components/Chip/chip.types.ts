import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ActionColor, RadiusStep } from '../../tokens/components';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface ChipSx {
  /** The pill. */
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The cross that takes it away. */
  remove?: StyleProp<ViewStyle>;
}

export interface ChipProps extends DashforgeProps {
  /** The word on it. Short: a chip is a token, not a sentence. */
  label: string;
  /**
   * Drawn before the word, at the label's own colour so it follows the
   * chosen state without being told.
   * @default undefined
   */
  icon?: IconComponent;
  /**
   * Chosen. A chip that can be chosen is announced to a reader as
   * something with an on and an off, rather than as a button that does
   * nothing visible.
   * @default false
   */
  selected?: boolean;
  /**
   * Pressed. Without this and without `onRemove` the chip is a label
   * with a border and is announced as text, which is the honest
   * outcome: nothing about it is pressable.
   * @default undefined
   */
  onPress?: () => void;
  /**
   * Adds the cross, and is told when it is pressed.
   *
   * The cross is a target of its own with its own name, because
   * "remove" and "choose" are two different answers and a reader given
   * one element cannot tell them apart.
   *
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * What the cross is called. Give it the chip's own word: "Rimuovi
   * Milano" is useful, "Rimuovi" eleven times is not.
   * @default `Rimuovi ${label}`
   */
  removeLabel?: string;
  /**
   * The role, from the same five every action in this library uses.
   * It colours the chosen state; unchosen, a chip is an outline.
   * @default 'primary'
   */
  color?: ActionColor;
  /**
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * How rounded. A chip is a pill by default, which is the shape that
   * says "one of several small things" rather than "a button".
   * @default 'full'
   */
  radius?: RadiusStep;
  /**
   * Inert and dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * What assistive technology reads instead of the word.
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: ChipSx;
}
