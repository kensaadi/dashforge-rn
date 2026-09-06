import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** What a radio's value may be. Carried to the payload unchanged. */
export type RadioValue = string | number;

/** Per-slot style overrides on the group. */
export interface RadioGroupSx {
  root?: StyleProp<ViewStyle>;
  /** The group's own question, above the options. */
  legend?: StyleProp<TextStyle>;
  /** The container the options sit in. */
  options?: StyleProp<ViewStyle>;
  helper?: StyleProp<TextStyle>;
}

/** Per-slot style overrides on one option. */
export interface RadioOptionSx {
  row?: StyleProp<ViewStyle>;
  /** The circle, not the dot inside it. */
  circle?: StyleProp<ViewStyle>;
  dot?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

export interface RadioGroupProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * **The group registers, not the options.** One field holds one
   * answer, and the options are how it is offered, which is the shape
   * that separates this from every control built so far: `TextField`,
   * `Checkbox` and `Switch` each own their field, and here several
   * controls share one.
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
   * The question the options answer. Announced as the group's name, so a
   * screen reader says it once before reading the choices rather than
   * leaving four labels with nothing to belong to.
   * @default undefined
   */
  label?: string;
  /**
   * Text under the options, replaced by the validation message when the
   * group is invalid.
   * @default undefined
   */
  helperText?: string;
  /**
   * Marks the group visually and passes `required` to the engine.
   * @default false
   */
  required?: boolean;
  /**
   * Force the invalid state, in both directions.
   * @default undefined
   */
  error?: boolean;
  /** Disables every option at once. @default false */
  disabled?: boolean;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Down the page or across it. Horizontal wraps, since three or four
   * short answers on one line is the case it exists for and a phone is
   * narrow.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  /** Controlled selection. In form mode the engine supplies it instead. */
  value?: RadioValue;
  /** Uncontrolled initial selection. Ignored in form mode. */
  defaultValue?: RadioValue;
  /** @default undefined */
  onValueChange?: (value: RadioValue) => void;
  /** The `<RadioGroup.Option>` elements. */
  children?: ReactNode;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: RadioGroupSx;
}

export interface RadioOptionProps
  extends Omit<PressableProps, 'style' | 'disabled' | 'children'>,
    DashforgeProps {
  /** What choosing this option puts in the field. */
  value: RadioValue;
  /**
   * The answer beside the circle. Pressing it selects, because a word is
   * a bigger target than a circle.
   * @default undefined
   */
  label?: ReactNode;
  /**
   * Disables this option alone. The group's own `disabled` disables all
   * of them and is not overridden from here.
   * @default false
   */
  disabled?: boolean;
  /** @default undefined */
  sx?: RadioOptionSx;
}
