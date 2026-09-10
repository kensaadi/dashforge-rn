import type { StyleProp, ViewStyle } from 'react-native';
import type { TextFieldProps, TextFieldSx } from '../TextField/textField.types';

/** Per-slot style overrides. The field's own slots, plus the steppers. */
export interface NumberFieldSx extends TextFieldSx {
  /** The pair of buttons, when there is one. */
  steppers?: StyleProp<ViewStyle>;
  /** One button. */
  stepper?: StyleProp<ViewStyle>;
}

export interface NumberFieldProps
  extends Omit<
    TextFieldProps,
    'value' | 'defaultValue' | 'onChangeText' | 'keyboardType' | 'multiline' | 'sx'
  > {
  /** Controlled value. In form mode the engine supplies it instead. */
  value?: number;
  /** Uncontrolled initial value. Ignored in form mode. */
  defaultValue?: number;
  /**
   * Told when the number changes, and told `undefined` when the field
   * is emptied. Not `0` and not `NaN`: an empty field is the absence of
   * an answer, and a quantity of zero is an answer.
   *
   * @default undefined
   */
  onValueChange?: (value: number | undefined) => void;
  /**
   * The floor. Applied when the field is left, not while it is typed:
   * clamping mid-keystroke means somebody typing `10` into a field with
   * a minimum of `5` watches the `1` become a `5`.
   *
   * @default undefined
   */
  min?: number;
  /**
   * The ceiling, applied the same way as `min`.
   * @default undefined
   */
  max?: number;
  /**
   * How much a stepper moves, and what a screen reader's adjust
   * gesture moves.
   * @default 1
   */
  step?: number;
  /**
   * Whole numbers only. Changes the keyboard to one with no separator
   * and drops any decimals that arrive by other means, such as a paste.
   *
   * @default false
   */
  integer?: boolean;
  /**
   * Fill the width it was given.
   *
   * `true` here and `false` on a `TextField`: a field in a form is a
   * block like the others. `false` is the compact case, a stepper beside
   * a product in a cart, and the input keeps a floor of its own so the
   * box does not shrink to the width of the two buttons.
   *
   * @default true
   */
  fullWidth?: boolean;
  /**
   * Show the minus and plus buttons.
   *
   * Worth it for a quantity, which is the case where somebody is
   * nudging a small number and the keyboard is in the way. Not worth it
   * for a price, where they are typing a value they already know.
   *
   * @default false
   */
  steppers?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: NumberFieldSx;
}
