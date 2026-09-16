import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface DateFieldSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The bordered box that opens the picker. */
  trigger?: StyleProp<ViewStyle>;
  value?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
  /** The fallback's panel, when there is no platform picker. */
  panel?: StyleProp<ViewStyle>;
}

export interface DateFieldProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * A day or a time of day.
   *
   * `date` answers with `YYYY-MM-DD` and `time` with `HH:mm`, and both
   * go into the payload as those strings. Never a `Date`: a `Date` is a
   * moment in time and a birthday is not one.
   *
   * @default 'date'
   */
  mode?: 'date' | 'time';
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
   * @default undefined
   */
  label?: string;
  /**
   * Text under the field, replaced by the validation message when it is
   * invalid.
   * @default undefined
   */
  helperText?: string;
  /**
   * Shown while nothing has been chosen.
   * @default undefined
   */
  placeholder?: string;
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
  /**
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * @default false
   */
  fullWidth?: boolean;
  /**
   * How rounded, named from the radius scale.
   * @default 'md'
   */
  radius?: RadiusStep;
  /**
   * The earliest answer allowed, `YYYY-MM-DD` or `HH:mm`.
   * @default undefined
   */
  min?: string;
  /**
   * The latest answer allowed, in the same shape.
   * @default undefined
   */
  max?: string;
  /**
   * How far apart the offered times are, in minutes. `time` only, and
   * only in the fallback: a platform picker has its own idea.
   * @default 15
   */
  minuteStep?: number;
  /**
   * BCP-47, for how the chosen day is written out and for the month and
   * weekday names in the fallback.
   * @default 'it-IT'
   */
  locale?: string;
  /**
   * Which column the fallback's week starts on. `0` is Sunday, `1` is
   * Monday, which is what most of the world outside the United States
   * reads.
   * @default 1
   */
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Controlled value. In form mode the engine supplies it instead. */
  value?: string;
  /** Uncontrolled initial value. Ignored in form mode. */
  defaultValue?: string;
  /**
   * Told when a different day or time is chosen, and told `undefined`
   * when it is cleared.
   * @default undefined
   */
  onValueChange?: (value: string | undefined) => void;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: DateFieldSx;
}
