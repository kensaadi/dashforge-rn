import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface SwitchSx {
  root?: StyleProp<ViewStyle>;
  /** The pressable row: the switch and its label. */
  row?: StyleProp<ViewStyle>;
  /** The rail. */
  track?: StyleProp<ViewStyle>;
  /** The circle that travels along it. */
  thumb?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface SwitchProps
  extends Omit<PressableProps, 'style' | 'disabled' | 'children'>,
    DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`.
   *
   * A switch usually belongs to a settings screen and takes effect where
   * it stands, but it registers like any other field when it is in a
   * form, and the value it puts in the payload is a boolean.
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
   * The label beside the switch. Pressing it toggles.
   * @default undefined
   */
  label?: ReactNode;
  /**
   * Text under the row, replaced by the validation message when invalid.
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
   * @default undefined
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Put the switch after the label rather than before it.
   *
   * The usual shape for a settings row: the setting is named on the left
   * and its state is on the right, where the eye goes to check it. As a
   * choice inside a form, before the label reads better, which is why
   * this is a prop and not a rule.
   *
   * @default 'end'
   */
  side?: 'start' | 'end';
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SwitchSx;
}
