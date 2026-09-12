import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface SliderSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  /** The number beside the label. */
  value?: StyleProp<TextStyle>;
  /** The rail. */
  track?: StyleProp<ViewStyle>;
  /** The part of the rail behind the thumb. */
  filled?: StyleProp<ViewStyle>;
  thumb?: StyleProp<ViewStyle>;
  helper?: StyleProp<TextStyle>;
}

export interface SliderProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * Field name in the surrounding `<DashFormProvider>`. The value it
   * writes is a **number**, like `NumberField`.
   * @default undefined
   */
  name?: string;
  /**
   * Validation rules, passed through to the form engine untouched.
   * @default undefined
   */
  rules?: unknown;
  /**
   * What the number means.
   * @default undefined
   */
  label?: string;
  /**
   * Text under the rail.
   * @default undefined
   */
  helperText?: string;
  /**
   * Show the number beside the label.
   * @default true
   */
  showValue?: boolean;
  /**
   * How the number is written out. Use it for a unit or a currency:
   * the rail says how far along, only the caller knows along what.
   * @default String
   */
  formatValue?: (value: number) => string;
  /** The floor. @default 0 */
  min?: number;
  /** The ceiling. @default 100 */
  max?: number;
  /**
   * What the thumb lands on. `1` by default, so a slider answers with
   * whole numbers unless it is told the answer is finer than that.
   * @default 1
   */
  step?: number;
  /** Controlled value. In form mode the engine supplies it instead. */
  value?: number;
  /**
   * Uncontrolled initial value. Ignored in form mode.
   * @default the floor
   */
  defaultValue?: number;
  /**
   * Told on every step as the thumb moves.
   * @default undefined
   */
  onValueChange?: (value: number) => void;
  /**
   * Told once, when the finger comes off.
   *
   * **This is the one to run anything expensive from.** A drag across
   * the rail reports every step it passes, and a request per step is a
   * hundred requests for one answer.
   *
   * @default undefined
   */
  onSlidingComplete?: (value: number) => void;
  /**
   * Inert and dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SliderSx;
}
