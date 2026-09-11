import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** What a segment's value may be. Carried to the payload unchanged. */
export type SegmentValue = string | number;

/** One segment. */
export interface SegmentOption {
  /** What the answer is. */
  value: SegmentValue;
  /** The word on it. One, and short: the segments share the width. */
  label: string;
  /**
   * Inert on its own, whatever the group says.
   * @default false
   */
  disabled?: boolean;
}

/** Per-slot style overrides. */
export interface SegmentedControlSx {
  root?: StyleProp<ViewStyle>;
  /** The question above the strip. */
  label?: StyleProp<TextStyle>;
  /** The recessed strip. */
  track?: StyleProp<ViewStyle>;
  /** The block that slides under the chosen segment. */
  thumb?: StyleProp<ViewStyle>;
  /** One segment's touch target. */
  segment?: StyleProp<ViewStyle>;
  /** One segment's word. */
  segmentLabel?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface SegmentedControlProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * The segments. Two to four: past that the words stop fitting and the
   * answer belongs in a `Select` or a `RadioGroup`.
   */
  options: SegmentOption[];
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * **The control registers, not the segments.** One field holds one
   * answer, and the segments are how it is offered, which is the same
   * shape `RadioGroup` has.
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
   * The question the segments answer. Announced as the group's name, so
   * a reader says it once before reading the choices.
   * @default undefined
   */
  label?: string;
  /**
   * Text under the strip, replaced by the validation message when the
   * answer is wrong.
   * @default undefined
   */
  helperText?: string;
  /**
   * Marks the group visually and passes `required` to the engine. Does
   * not validate on its own.
   * @default false
   */
  required?: boolean;
  /**
   * Force the invalid state, in both directions.
   * @default undefined
   */
  error?: boolean;
  /**
   * Disables every segment at once.
   * @default false
   */
  disabled?: boolean;
  /**
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /** Controlled selection. In form mode the engine supplies it instead. */
  value?: SegmentValue;
  /**
   * Uncontrolled initial selection. Ignored in form mode, where the
   * engine's own defaults are the place for it.
   * @default undefined
   */
  defaultValue?: SegmentValue;
  /**
   * Told when a different segment is chosen.
   * @default undefined
   */
  onValueChange?: (value: SegmentValue) => void;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SegmentedControlSx;
}
