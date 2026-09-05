import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** A gap by name, from the spacing scale, or a number when the scale has no word for it. */
export type StackGap = 'none' | 'inline' | 'stack' | 'inset' | 'section' | number;

export interface StackProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  children?: ReactNode;
  /**
   * Down the page or across it.
   * @default 'column'
   */
  direction?: 'column' | 'row';
  /**
   * The space between children, named from the spacing scale so the call
   * site says why rather than how much: `inline` between things on a
   * line, `stack` between stacked things, `inset` the size of a card's
   * padding, `section` between parts of a screen.
   *
   * A number is accepted for the cases the scale has no word for, and is
   * the same kind of escape as `sx`: it works, and it means you have
   * stepped outside the scale.
   *
   * @default 'stack'
   */
  gap?: StackGap;
  /**
   * Alignment across the stack's direction.
   *
   * **The default depends on the direction, deliberately.** A column
   * stretches, which is React Native's own behaviour and what makes a
   * stack of cards fill the width. A row centres, because the alternative
   * stretches every child to the height of the tallest, and a button
   * beside a paragraph then becomes as tall as the paragraph.
   *
   * @default 'stretch' in a column, 'center' in a row
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /**
   * Distribution along the stack's direction. Only means anything when
   * the stack has more room than its children need.
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /**
   * Let children fall onto the next line when they do not fit.
   * @default false
   */
  wrap?: boolean;
  /**
   * Draw a line between children.
   *
   * `true` uses the separator from the theme, which is the part worth
   * not having to look up. A node replaces it entirely, for the cases
   * where the divider is a label or a piece of content rather than a
   * rule.
   *
   * @default false
   */
  divider?: boolean | ReactNode;
  /**
   * Style override. Applied last, so it wins.
   * @default undefined
   */
  sx?: StyleProp<ViewStyle>;
}
