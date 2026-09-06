import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. A field has parts you cannot compose around. */
export interface CheckboxSx {
  root?: StyleProp<ViewStyle>;
  /** The pressable row: the box and its label. */
  row?: StyleProp<ViewStyle>;
  /** The box itself, not the mark inside it. */
  box?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface CheckboxProps
  extends Omit<PressableProps, 'style' | 'disabled' | 'children'>,
    DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * As on `TextField`, its absence is what separates the two modes: with
   * a name and a form it registers and reads its value from the engine,
   * without either it is an ordinary controlled input.
   *
   * The value it puts in the payload is a **boolean**, not a string.
   *
   * @default undefined
   */
  name?: string;
  /**
   * Validation rules, passed through to the form engine untouched.
   * @default undefined
   */
  rules?: unknown;
  /**
   * The label beside the box. Pressing it toggles, because a target the
   * size of a word is easier to hit than one the size of a box.
   * @default undefined
   */
  label?: ReactNode;
  /**
   * Text under the row, replaced by the validation message when invalid
   * rather than shown alongside it.
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
  /** @default false */
  disabled?: boolean;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Controlled state. In form mode the engine supplies it instead. */
  checked?: boolean;
  /** Uncontrolled initial state. Ignored in form mode. */
  defaultChecked?: boolean;
  /**
   * Neither checked nor unchecked: some of what this box stands for is
   * true and some is not.
   *
   * Visual *and* announced, since `accessibilityState` has a `'mixed'`
   * for exactly this and a box that only looks indeterminate says
   * "unchecked" to a screen reader, which is the wrong answer rather
   * than a missing one.
   *
   * Toggling from here goes to checked, which is what a parent box in a
   * partly-selected list should do.
   *
   * @default false
   */
  indeterminate?: boolean;
  /**
   * @default undefined
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: CheckboxSx;
}
