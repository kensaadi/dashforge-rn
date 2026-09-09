import type { ReactNode } from 'react';
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface ListItemSx {
  /** The row itself. */
  root?: StyleProp<ViewStyle>;
  /** What sits before the text. */
  leading?: StyleProp<ViewStyle>;
  /** The title and subtitle block. */
  body?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  subtitle?: StyleProp<TextStyle>;
  /** The short answer on the right. */
  value?: StyleProp<TextStyle>;
  /** The hairline above the row, when it is in a `List` that draws one. */
  separator?: StyleProp<ViewStyle>;
  chevron?: StyleProp<ViewStyle>;
}

/**
 * Where the hairline between rows starts.
 *
 * `full` runs the width of the list. `inset` starts where the title of a
 * row with a leading icon starts, which is what a list of icon rows
 * wants and what iOS does. `none` draws nothing, for a list whose rows
 * are already separated by something else.
 */
export type ListDivider = 'full' | 'inset' | 'none';

export interface ListItemProps
  extends Omit<ViewProps, 'style' | 'children' | 'accessibilityLabel'>,
    Pick<PressableProps, 'onPress' | 'onLongPress'>,
    DashforgeProps {
  /**
   * The row's first line. A bare string is wrapped for you; React Native
   * would crash on it.
   */
  title: ReactNode;
  /**
   * The second line, for what the title does not say on its own.
   * @default undefined
   */
  subtitle?: ReactNode;
  /**
   * A short answer, on the right. The settings-row shape: "Lingua" on
   * the left, "Italiano" here.
   *
   * It sits before `trailing`, so a row can carry both a value and a
   * control, which is the order they appear in on every platform.
   *
   * @default undefined
   */
  value?: ReactNode;
  /**
   * What sits before the text: an avatar, a thumbnail, a checkbox.
   * @default undefined
   */
  leading?: ReactNode;
  /**
   * An icon in the leading slot, sized and coloured from the tokens.
   *
   * A shorthand for the common case, the way `startIcon` is on `Button`.
   * `leading` wins if both are given, and says so in development.
   *
   * @default undefined
   */
  icon?: IconComponent;
  /**
   * What sits at the end: a `Switch`, a `Badge`, an `IconButton`.
   *
   * **A row with a control in here should not also be pressable.** The
   * control wins its own press, because React Native asks the deepest
   * view under the finger first, but a screen reader is then handed one
   * element that is both a button and a switch and can only say one of
   * those things. Give the row an `onPress` or give it a control, not
   * both.
   *
   * @default undefined
   */
  trailing?: ReactNode;
  /**
   * The mark that says the row leads somewhere else.
   *
   * Off by default and never inferred from `onPress`: a chevron means
   * "this opens another screen", not "this is tappable". A row that
   * toggles something is tappable and has no chevron. A chevron without
   * an `onPress` is a promise nothing keeps, and says so in development.
   *
   * @default false
   */
  chevron?: boolean;
  /**
   * Makes the whole row a single target.
   *
   * With this set the row becomes a button as far as assistive
   * technology is concerned, and paints while pressed. Give it an
   * `accessibilityLabel` when the visible text does not already say
   * where it leads.
   *
   * @default undefined
   */
  onPress?: PressableProps['onPress'];
  /** @default undefined */
  onLongPress?: PressableProps['onLongPress'];
  /**
   * Inert and dimmed. Only meaningful with `onPress`, and dimming means
   * unavailable and nothing else.
   * @default false
   */
  disabled?: boolean;
  /**
   * How many lines the title may take before it truncates.
   * @default 1
   */
  titleLines?: number;
  /**
   * How many lines the subtitle may take before it truncates.
   * @default 2
   */
  subtitleLines?: number;
  /**
   * What assistive technology reads instead of the row's own text.
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: ListItemSx;
}

/** Per-slot style overrides. */
export interface ListSx {
  /** The column of rows. */
  root?: StyleProp<ViewStyle>;
}

export interface ListProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /** The rows. Anything else renders too; only rows draw a hairline. */
  children?: ReactNode;
  /**
   * Where the hairline between rows starts.
   * @default 'full'
   */
  divider?: ListDivider;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: ListSx;
}
