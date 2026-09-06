import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { RadioValue } from '../RadioGroup/radioGroup.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface SelectSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The closed control, not the words inside it. */
  trigger?: StyleProp<ViewStyle>;
  value?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface SelectProps extends DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * As on `RadioGroup`, the select owns the field and its options do
   * not: one field holds one answer, and an option offers a value.
   *
   * @default undefined
   */
  name?: string;
  /**
   * Validation rules, passed through to the form engine untouched.
   * @default undefined
   */
  rules?: unknown;
  /** @default undefined */
  label?: string;
  /**
   * What the closed control says before anything is chosen. Not a value:
   * it is never submitted and it disappears on the first choice.
   * @default undefined
   */
  placeholder?: string;
  /**
   * The heading of the list when it opens. Falls back to `label`, since
   * a list that asks a different question from the field it fills is
   * usually a mistake rather than a subtlety.
   * @default the label
   */
  title?: string;
  /** @default undefined */
  helperText?: string;
  /** @default false */
  required?: boolean;
  /** @default undefined */
  error?: boolean;
  /** @default false */
  disabled?: boolean;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * How rounded the closed control is, named from the radius scale.
   * @default 'md'
   */
  radius?: RadiusStep;
  /** Controlled selection. In form mode the engine supplies it instead. */
  value?: RadioValue;
  /** Uncontrolled initial selection. Ignored in form mode. */
  defaultValue?: RadioValue;
  /** @default undefined */
  onValueChange?: (value: RadioValue) => void;
  /** The `<Select.Option>` elements. */
  children?: ReactNode;
  /** @default undefined */
  sx?: SelectSx;
}

export interface SelectOptionProps {
  /** What choosing this option puts in the field. */
  value: RadioValue;
  /** What it says, both in the list and in the closed control. */
  label: string;
  /** @default false */
  disabled?: boolean;
}
