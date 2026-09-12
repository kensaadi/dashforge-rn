import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface OTPFieldSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The row of boxes. */
  boxes?: StyleProp<ViewStyle>;
  /** One box. */
  box?: StyleProp<ViewStyle>;
  /** One character. */
  digit?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface OTPFieldProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * How many characters the code has.
   * @default 6
   */
  length?: number;
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   * @default undefined
   */
  name?: string;
  /**
   * Validation rules, passed through to the form engine untouched.
   * @default undefined
   */
  rules?: unknown;
  /**
   * What the code is for.
   * @default undefined
   */
  label?: string;
  /**
   * Text under the boxes, replaced by the validation message when the
   * code is wrong.
   * @default undefined
   */
  helperText?: string;
  /**
   * Marks the field visually and passes `required` to the engine.
   * @default false
   */
  required?: boolean;
  /**
   * Force the invalid state, in both directions.
   * @default undefined
   */
  error?: boolean;
  /**
   * @default false
   */
  disabled?: boolean;
  /** Controlled value. In form mode the engine supplies it instead. */
  value?: string;
  /** Uncontrolled initial value. Ignored in form mode. */
  defaultValue?: string;
  /**
   * Told on every character.
   * @default undefined
   */
  onChangeText?: (value: string) => void;
  /**
   * Told once, when the last box fills.
   *
   * This is the one to verify from: a code is only a code when it is
   * complete, and checking a partial one with the server is a request
   * that can only fail.
   *
   * @default undefined
   */
  onComplete?: (value: string) => void;
  /**
   * Put the keyboard up as soon as it appears, which is what a screen
   * whose only job is this code wants.
   * @default true
   */
  autoFocus?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: OTPFieldSx;
}
