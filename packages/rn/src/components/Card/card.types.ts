import type { ReactNode } from 'react';
import type {
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';
import type { CardTone } from '../../tokens/components';
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
   * What the card means, as a role rather than a colour.
   *
   * A tone tints the ground, recolours the edge and the text with it,
   * and keeps all three consistent in both modes. It is the answer to
   * "this card is a warning"; it is not the answer to "this card is
   * #FF5722", which is `sx` and which you should know puts you outside
   * the theme, since a fixed colour neither inverts in dark mode nor
   * follows a theme swap.
   *
   * Orthogonal to `variant`: the tone decides the colours, the variant
   * still decides whether there is an edge or a shadow.
   *
   * @default 'neutral'
   */
  tone?: 'neutral' | CardTone;
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

export interface CardMediaProps
  extends Omit<ImageProps, 'source' | 'style' | 'resizeMode'>,
    DashforgeProps {
  /** The image. */
  source: ImageSourcePropType;
  /**
   * Shape, as a ratio rather than a height, so the band keeps its
   * proportions at every width. Ignored when `height` is given.
   * @default 16 / 9
   */
  aspectRatio?: number;
  /**
   * A fixed height, for the cases a ratio cannot express.
   * @default undefined
   */
  height?: number;
  /**
   * @default 'cover'
   */
  resizeMode?: ImageProps['resizeMode'];
  /**
   * Whether the band also meets the card's top edge, cancelling the top
   * padding and rounding its top corners.
   *
   * `'top'` is the default because a media band is nearly always the
   * first child. Set `'none'` for one sitting between two blocks of
   * content, where a negative top margin would pull it over whatever is
   * above it.
   *
   * Horizontal bleed happens either way: a band that stopped at the
   * card's padding would not be a band.
   *
   * @default 'top'
   */
  flush?: 'top' | 'none';
  /**
   * Describe the image only when it carries information the text does
   * not. Without one it is announced as decoration and skipped, which is
   * the right outcome for a photograph beside a title that already says
   * what it is.
   * @default undefined
   */
  accessibilityLabel?: string;
  /** @default undefined */
  sx?: StyleProp<ImageStyle>;
}

export interface CardFooterProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /** The actions. */
  children?: ReactNode;
  /**
   * How the actions sit.
   *
   * `'end'` is the default, which is where a confirm lands on both
   * platforms. `'stack'` puts them one above the other instead, which is
   * the shape a phone wants when the card is asking for one thing.
   *
   * **`'stack'` decides the direction, not the width.** A `Button` that
   * is not `fullWidth` states `alignSelf: 'flex-start'` for itself, and
   * a child's `alignSelf` beats its parent's `alignItems`, as it should:
   * the control knows its own shape better than the row it happens to be
   * in. So a stacked primary action is `<Button fullWidth>`, and the
   * footer does not pretend otherwise.
   *
   * @default 'end'
   */
  align?: 'start' | 'end' | 'between' | 'stack';
  /**
   * Draw a hairline above the actions, across the whole card rather than
   * inside its padding, which is where a rule belongs when it is
   * separating one region from another.
   * @default false
   */
  divider?: boolean;
  /** @default undefined */
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
   * Trailing content in the heading row, aligned to the top rather than
   * centred so a one-line control does not drift when the title wraps to
   * two.
   *
   * **Not the card's call to action.** This is the slot for something
   * that belongs beside the title: a price, a "see all", an overflow
   * menu, a status chip. What the card is asking the user to *do* goes in
   * `Card.Footer`, at the bottom, where it is found by anyone who has
   * read the card first.
   *
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
