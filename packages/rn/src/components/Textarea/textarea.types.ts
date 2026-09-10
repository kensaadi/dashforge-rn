import type { TextFieldProps, TextFieldSx } from '../TextField/textField.types';

/** Per-slot style overrides, the same slots a `TextField` has. */
export type TextareaSx = TextFieldSx;

export interface TextareaProps
  extends Omit<TextFieldProps, 'multiline' | 'numberOfLines' | 'sx'> {
  /**
   * How many lines of text it is tall before it has any content.
   *
   * A real height and not `numberOfLines`, which sizes the box on
   * Android and does nothing at all on iOS. The floor is computed from
   * the input's own line height, so it follows the type scale and the
   * user's text-size setting instead of a magic number.
   *
   * @default 4
   */
  rows?: number;
  /**
   * How tall it may grow before the text starts to scroll inside it.
   * Without one it grows with the content, which on a long note pushes
   * everything under it off the screen.
   *
   * @default undefined
   */
  maxRows?: number;
  /**
   * Fill the width it was given.
   *
   * `true` here and `false` on a `TextField`, deliberately: a field for
   * more than one line is a block, and one as wide as its own empty
   * placeholder is one nobody can write in.
   *
   * @default true
   */
  fullWidth?: boolean;
  /**
   * Show how much room is left, as `written/maxLength`.
   *
   * Only means anything with a `maxLength`, and says so in development
   * when it is asked for without one. It takes the helper's place and
   * steps aside for a validation message: two lines of competing advice
   * is worse than one.
   *
   * @default false
   */
  showCount?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: TextareaSx;
}
