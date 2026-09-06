import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/**
 * Per-slot style overrides.
 *
 * A field has parts a consumer cannot compose around, so `sx` is a map
 * here rather than a flat style. Atomic components take the flat form;
 * the shape is fixed per component and never a union of the two, so
 * there is nothing to disambiguate at runtime.
 */
export interface TextFieldSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The bordered box around the input, not the text inside it. */
  control?: StyleProp<ViewStyle>;
  input?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface TextFieldProps
  extends
    Omit<TextInputProps, 'style' | 'editable' | 'value' | 'defaultValue'>,
    DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * Optional, and its absence is what separates the two modes. With a
   * name and a form the field registers, reads its value from the
   * engine and reports validation. Without either it is an ordinary
   * controlled input, which is the right thing for a search box that
   * belongs to no form.
   *
   * @default undefined
   */
  name?: string;
  /**
   * Validation rules, passed through to the form engine untouched. The
   * shape belongs to the resolver in use, so it is opaque here.
   * @default undefined
   */
  rules?: unknown;
  /**
   * @default undefined
   */
  label?: string;
  /**
   * Text under the field. Replaced by the validation message when the
   * field is invalid, rather than shown alongside it: two lines of
   * competing advice is worse than one.
   * @default undefined
   */
  helperText?: string;
  /**
   * Marks the field visually and passes `required` to the engine. Does
   * not validate on its own.
   * @default false
   */
  required?: boolean;
  /**
   * Force the invalid state. Overrides whatever the form engine thinks,
   * in both directions: `false` also clears the engine's message.
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
   * How rounded, named from the radius scale. A number still goes
   * through `sx`.
   * @default 'md'
   */
  radius?: RadiusStep;
  /**
   * Rendered inside the control before the input. A currency symbol, a
   * search glyph. Not pressable: use `IconButton` beside the field for
   * anything that acts.
   * @default undefined
   */
  startAdornment?: ReactNode;
  /**
   * @default undefined
   */
  endAdornment?: ReactNode;
  /** Controlled value. In form mode the engine supplies it instead. */
  value?: string;
  /** Uncontrolled initial value. Ignored in form mode. */
  defaultValue?: string;
  /**
   * React Native's own callback, which hands over the string rather than
   * an event. Preferred over `onChange` for that reason.
   * @default undefined
   */
  onChangeText?: (value: string) => void;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: TextFieldSx;
}
