import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { DashPressState, IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

export interface IconButtonProps
  extends Omit<PressableProps, 'style' | 'children' | 'disabled'>,
    DashforgeProps {
  /**
   * The icon, as the **component** rather than as an element, so the
   * library can size and colour it for the variant in play. Any icon set
   * whose components take `size` and `color` fits, which is the de facto
   * standard, and none of them is a dependency here.
   */
  icon: IconComponent;
  /**
   * What the button does, in words.
   *
   * **Required in practice, and warned about in development when it is
   * missing.** A button with a label announces itself; one with only a
   * glyph announces nothing at all, and a screen reader is left saying
   * "button". The icon is the affordance, not the name.
   */
  accessibilityLabel?: string;
  /**
   * Visual treatment. `ghost` is the default here where `solid` is the
   * default on `Button`: an icon button is usually one of several in a
   * toolbar, and five filled circles in a row is a wall.
   * @default 'ghost'
   */
  variant?: 'solid' | 'outline' | 'ghost';
  /**
   * Semantic role.
   * @default 'secondary'
   */
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * A square with rounded corners, or a circle.
   * @default 'square'
   */
  shape?: 'square' | 'circle';
  /**
   * Replaces the icon with a spinner and makes the button inert. The
   * button keeps its colour, because dimming would say "you cannot",
   * which is a different message from "wait".
   * @default false
   */
  loading?: boolean;
  /** @default false */
  disabled?: boolean;
  /**
   * Style override. Always applied last, so it wins. The function form
   * receives the live interaction state, which is the only way to reach
   * the pressed appearance from outside.
   * @default undefined
   */
  sx?: StyleProp<ViewStyle> | ((state: DashPressState) => StyleProp<ViewStyle>);
}
