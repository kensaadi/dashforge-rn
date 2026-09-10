import { useDashFieldMeta } from '@dashforge/forms';
import { resolveTypeStyle } from '../../theme/typography';
import { useComponentTokens } from '../../theme/useComponentTokens';
import { TextField } from '../TextField/TextField';
import type { TextareaProps } from './textarea.types';

/** What a line of the input's own type actually measures. */
function lineHeightOf(lineHeight: number | undefined, fontSize: number): number {
  return lineHeight ?? Math.round(fontSize * 1.4);
}

/**
 * A field for more than one line.
 *
 * Thin on purpose: it is a `TextField` with `multiline` on, which means
 * the form bridge, the validation, the adornments, `access` and
 * `visibleWhen` are the same code and not a second copy of it. What it
 * adds is the part that is genuinely different about a multi-line field.
 *
 * **`rows` is a height, not `numberOfLines`.** That prop sizes the box
 * on Android and does nothing whatsoever on iOS, which is the kind of
 * difference that gets discovered on a device three weeks later. The
 * floor here is computed from the input's own line height, so it follows
 * the type scale and the reader's text-size setting.
 *
 * It grows with what is typed. `maxRows` is where it stops growing and
 * starts scrolling, and a note field without one eventually pushes
 * everything below it off the screen.
 *
 * It reads `TextField`'s tokens rather than owning a set: the two are
 * the same control, and a theme that restyled one and not the other
 * would be a bug nobody could see coming.
 *
 * @example
 * ```tsx
 * <Textarea name="note" label="Note" rows={5} maxRows={10} />
 * <Textarea label="Messaggio" maxLength={280} showCount />
 * ```
 */
export function Textarea(props: TextareaProps) {
  const tokens = useComponentTokens('TextField');

  const {
    rows = 4,
    maxRows,
    // A block and not an inline control, which is where this parts
    // company with `TextField`. A note field as wide as its own empty
    // placeholder is a note field nobody can write in.
    fullWidth = true,
    showCount = false,
    maxLength,
    helperText,
    name,
    value,
    defaultValue,
    sx,
    ...rest
  } = props;

  // The reactive snapshot, so the count follows a reset or a
  // programmatic write and not only the user's own typing.
  const fieldMeta = useDashFieldMeta(name ?? '');

  if (__DEV__ && showCount && maxLength === undefined) {
    console.warn(
      '[@dashforge/rn] <Textarea> has showCount without a maxLength, so there is no ' +
        'limit to count against and nothing is drawn.',
    );
  }

  const input = resolveTypeStyle(tokens.typography.input);
  const line = lineHeightOf(input.lineHeight, input.fontSize ?? 16);

  const written = (() => {
    if (name && fieldMeta.value != null) return String(fieldMeta.value).length;
    if (value !== undefined) return value.length;
    return defaultValue?.length ?? 0;
  })();

  const counted =
    showCount && maxLength !== undefined ? `${written}/${maxLength}` : undefined;

  return (
    <TextField
      multiline
      name={name}
      value={value}
      defaultValue={defaultValue}
      maxLength={maxLength}
      // The count takes the helper's place and gives it back the moment
      // there is a validation message: `TextField` already replaces the
      // helper when the field is invalid, so passing the count as the
      // helper inherits that rule instead of restating it.
      helperText={helperText ?? counted}
      fullWidth={fullWidth}
      {...rest}
      sx={{
        ...sx,
        input: [
          {
            minHeight: rows * line,
            maxHeight: maxRows === undefined ? undefined : maxRows * line,
          },
          sx?.input,
        ],
      }}
    />
  );
}
