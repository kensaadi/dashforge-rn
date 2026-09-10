import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { CardTone } from '../../tokens/components';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface EmptyStateSx {
  /** The centred column. */
  root?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  description?: StyleProp<TextStyle>;
  /** The block holding the words, which is what the width caps. */
  body?: StyleProp<ViewStyle>;
}

export interface EmptyStateProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * What is not here. A bare string is wrapped for you and announced as
   * a heading; React Native would crash on it otherwise.
   */
  title: ReactNode;
  /**
   * Why, and what to do about it. One or two lines: this is the screen
   * where the words are the whole content, and three lines of them is a
   * paragraph nobody reads.
   *
   * @default undefined
   */
  description?: ReactNode;
  /**
   * The mark above the words, sized and coloured from the tokens.
   * @default undefined
   */
  icon?: IconComponent;
  /**
   * Something drawn instead of the icon: a real illustration, an image.
   * Wins over `icon`, and says so in development when both were given.
   *
   * @default undefined
   */
  illustration?: ReactNode;
  /**
   * What to do about it. Usually one `Button`; pass a `Stack` when there
   * are genuinely two things to offer, which there rarely are.
   *
   * @default undefined
   */
  action?: ReactNode;
  /**
   * What kind of nothing this is, from the same five tones a `Card`
   * uses.
   *
   * **It colours the mark and nothing else.** A failed request is not an
   * alarm, and a page of red words reads like one; the title and the
   * description keep the colours every other piece of text on the screen
   * has.
   *
   * @default 'neutral'
   */
  tone?: 'neutral' | CardTone;
  /**
   * Take the whole space available and sit in the middle of it, for the
   * empty state that *is* the screen rather than one that fills a card.
   *
   * @default false
   */
  fill?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: EmptyStateSx;
}
