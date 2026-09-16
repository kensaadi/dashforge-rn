import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Both ends of the answer. Either may be missing while it is being picked. */
export interface DateRangeValue {
  /** `YYYY-MM-DD`, or `null`. */
  start: string | null;
  /** `YYYY-MM-DD`, or `null` while only a start has been chosen. */
  end: string | null;
}

/** Per-slot style overrides. */
export interface DateRangeFieldSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The bordered box that opens the calendar. */
  trigger?: StyleProp<ViewStyle>;
  value?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
  /** The calendar's panel. */
  panel?: StyleProp<ViewStyle>;
}

export interface DateRangeFieldProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * **It writes one field holding both ends**, `{ start, end }`, because
   * a range is one answer with two ends and not two answers. A resolver
   * that wants them flat gets them apart at the edge, where it already
   * knows the shape it wants.
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
   * The earliest day either end may take, `YYYY-MM-DD`.
   * @default undefined
   */
  min?: string;
  /**
   * The latest day either end may take.
   * @default undefined
   */
  max?: string;
  /**
   * How many months are shown at once. Two is what a desktop range
   * picker does and what a phone has no room for, so it is a choice and
   * not a default.
   * @default 1
   */
  monthCount?: 1 | 2;
  /**
   * BCP-47, for how the days are written out and for the month and
   * weekday names.
   * @default 'it-IT'
   */
  locale?: string;
  /**
   * Which column the week starts on. `0` is Sunday.
   * @default 1
   */
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Controlled value. In form mode the engine supplies it instead. */
  value?: DateRangeValue;
  /** Uncontrolled initial value. Ignored in form mode. */
  defaultValue?: DateRangeValue;
  /**
   * Told on both presses: once with only a start, once with both ends.
   *
   * The half-picked range is reported on purpose. A caller showing "from
   * the 14th" while somebody hunts for the other end is showing them
   * what they have done, and a caller that only wants the finished
   * answer checks `end`.
   *
   * @default undefined
   */
  onValueChange?: (value: DateRangeValue) => void;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: DateRangeFieldSx;
}
