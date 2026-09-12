import type { StyleProp, ViewStyle } from 'react-native';
import type { TextFieldProps, TextFieldSx } from '../TextField/textField.types';

/** Per-slot style overrides. The field's own slots, plus the two marks. */
export interface SearchFieldSx extends TextFieldSx {
  /** The magnifier. */
  glyph?: StyleProp<ViewStyle>;
  /** The cross that empties the field. */
  clear?: StyleProp<ViewStyle>;
}

export interface SearchFieldProps
  extends Omit<
    TextFieldProps,
    'startAdornment' | 'endAdornment' | 'multiline' | 'keyboardType' | 'sx'
  > {
  /**
   * Told what to search for, once the typing has stopped.
   *
   * **This is the one to run a query with**, not `onChangeText`. A field
   * that queried on every keystroke sends eight requests for a word of
   * eight letters and shows the answer to the seventh.
   *
   * @default undefined
   */
  onSearch?: (query: string) => void;
  /**
   * How long the typing has to stop for, in milliseconds. `0` fires
   * `onSearch` on every keystroke, which is what a local filter over a
   * list already in memory wants and what a network query does not.
   *
   * @default 300
   */
  debounce?: number;
  /**
   * Told when the keyboard's search key is pressed. Fires at once and
   * cancels whatever was waiting, because somebody who pressed search
   * has stopped typing by definition.
   *
   * @default undefined
   */
  onSubmit?: (query: string) => void;
  /**
   * Show the cross that empties the field, when there is anything to
   * empty.
   * @default true
   */
  clearable?: boolean;
  /**
   * What the cross is called.
   * @default 'Cancella la ricerca'
   */
  clearLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: SearchFieldSx;
}
