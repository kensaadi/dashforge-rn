import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import type { SemanticTokens } from '../../tokens/types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** An entry of the type scale. Carries size, weight, line height and tracking together. */
export type TypographyVariant = keyof SemanticTokens['typography'];

/**
 * Text colour, named by role. Text roles and feedback roles share one
 * union because at a call site the question is the same one.
 */
export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'inverse'
  | 'onAccent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface TypographyProps extends Omit<TextProps, 'style'>, DashforgeProps {
  children?: ReactNode;
  /**
   * Which entry of the type scale to use. Brings family, size, weight,
   * line height and tracking as a set, because those five are never
   * chosen independently in practice.
   * @default 'body'
   */
  variant?: TypographyVariant;
  /**
   * Colour, named by role rather than by value.
   * @default 'primary'
   */
  color?: TypographyColor;
  /**
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Override the variant's weight. The one escape hatch inside the
   * scale, and it exists only because "one word in bold inside a
   * sentence" is too common to force through `sx`.
   * @default undefined
   */
  weight?: '400' | '500' | '700';
  /**
   * Style override. Applied last, so it wins.
   * @default undefined
   */
  sx?: StyleProp<TextStyle>;
}
