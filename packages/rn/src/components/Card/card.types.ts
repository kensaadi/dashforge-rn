import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/**
 * The parts `Card.Header` paints.
 *
 * The card itself paints one thing, its own box, so its `sx` is a plain
 * style like `Button`'s. Only the header has parts worth naming, and
 * they belong to the component that draws them: a slot map on `Card`
 * would accept keys the card never reads.
 */
export interface CardHeaderSx {
  /** The row holding the text block and the action. */
  header?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  subtitle?: StyleProp<TextStyle>;
}

export interface CardProps
  extends Omit<ViewProps, 'style'>,
    Pick<PressableProps, 'onPress' | 'onLongPress'>,
    DashforgeProps {
  children?: ReactNode;
  /**
   * How the card separates itself from the page.
   *
   * `outlined` is the default because the language is flat and bordered:
   * an edge costs nothing to read, survives every background, and does
   * not compete with the content. `elevated` is the exception for a card
   * that has to float above the page, and shadows read poorly on a dark
   * ground, so it should be the minority. `filled` sits *into* the page
   * rather than on it, for a grouping that is not a separate object.
   *
   * @default 'outlined'
   */
  variant?: 'outlined' | 'elevated' | 'filled';
  /**
   * Inner spacing. `none` is for a card whose content reaches the edges,
   * a full-bleed image or a list that draws its own rows.
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Make the whole card a single target.
   *
   * With this set the card becomes a button as far as assistive
   * technology is concerned, and shows a pressed state. Give it an
   * `accessibilityLabel` when the visible content does not already say
   * where it leads.
   * @default undefined
   */
  onPress?: PressableProps['onPress'];
  /** @default undefined */
  onLongPress?: PressableProps['onLongPress'];
  /**
   * Inert, and dimmed. Only meaningful with `onPress`.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style override on the card's box. Applied last, so it wins.
   *
   * The header is styled through `Card.Header`'s own `sx`, because that
   * is the component that draws it.
   *
   * @default undefined
   */
  sx?: StyleProp<ViewStyle>;
}

export interface CardHeaderProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * The card's heading. A string is rendered on the title scale; a node
   * is placed as it is, for the cases the scale does not cover.
   * @default undefined
   */
  title?: ReactNode;
  /**
   * The second line, on the scale meant for it.
   * @default undefined
   */
  subtitle?: ReactNode;
  /**
   * Trailing content, aligned to the top rather than centred so a
   * one-line control does not drift when the title wraps to two.
   * @default undefined
   */
  action?: ReactNode;
  /**
   * Anything below the two lines and inside the header block.
   * @default undefined
   */
  children?: ReactNode;
  /**
   * Style overrides by part. Applied last, so they win.
   * @default undefined
   */
  sx?: CardHeaderSx;
}
