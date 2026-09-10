import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { ActionColor } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface BadgeSx {
  /** The pill, or the dot. */
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

export interface BadgeProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * What it says. A bare string is wrapped for you; React Native would
   * crash on it.
   * @default undefined
   */
  children?: ReactNode;
  /**
   * A number, capped at `max`. Wins over `children`, because a badge
   * that was given both a count and a label was given two answers to
   * the same question.
   * @default undefined
   */
  count?: number;
  /**
   * Where the count stops being a number and starts being "a lot".
   * @default 99
   */
  max?: number;
  /**
   * No content at all: a dot that says "something changed" without
   * saying how much. Wins over both `count` and `children`.
   * @default false
   */
  dot?: boolean;
  /**
   * The role, from the same five every action in this library uses.
   * `secondary` is the neutral one.
   * @default 'primary'
   */
  color?: ActionColor;
  /**
   * `solid` is a saturated fill and carries across a photograph or a
   * busy row. `soft` is a tint, for a badge that has to sit in a page of
   * text without shouting.
   * @default 'solid'
   */
  variant?: 'solid' | 'soft';
  /**
   * What assistive technology reads.
   *
   * Give it one. "3" on its own is not information, and a dot has no
   * text at all: without a label it is announced as nothing, which for a
   * dot is the honest outcome and for a count is a loss.
   *
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: BadgeSx;
}
