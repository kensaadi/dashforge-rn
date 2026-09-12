import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useDashFieldMeta } from '@dashforge/forms';
import { useComponentTokens } from '../../theme/useComponentTokens';
import { TextField } from '../TextField/TextField';
import type { SearchFieldProps } from './searchField.types';

/**
 * The magnifier, drawn from two views.
 *
 * A ring and a bar at forty-five degrees. This package ships no icon set
 * and imports no drawing library, and the alternative was asking every
 * caller to pass an icon to a field whose whole identity is that mark.
 */
function Magnifier({
  size,
  thickness,
  handle,
  color,
  style,
}: {
  size: number;
  thickness: number;
  handle: number;
  color: string;
  style?: unknown;
}) {
  return (
    <View style={[{ width: size + handle * 0.7, height: size + handle * 0.7 }, style as never]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: handle,
          height: thickness,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/**
 * A field for looking for something.
 *
 * A `TextField` underneath, so the form bridge, the validation, `access`
 * and `visibleWhen` are the same code and not a second copy. What it
 * adds is the part that is different about searching.
 *
 * **`onSearch` is the one to run a query with, not `onChangeText`.** A
 * field that queried on every keystroke sends eight requests for a word
 * of eight letters and shows the answer to the seventh. The waiting is
 * here rather than at the call site because it is the same four lines
 * every time, and the two that get forgotten are cancelling on unmount
 * and cancelling when the search key is pressed.
 *
 * The text itself is never debounced: a controlled input that lagged
 * behind the keyboard would drop characters.
 *
 * It turns off autocorrect and capitals, which is the difference between
 * looking for `useRef` and looking for `Useref`.
 *
 * @example
 * ```tsx
 * <SearchField placeholder="Cerca" value={q} onChangeText={setQ} onSearch={run} />
 * <SearchField value={q} onChangeText={setQ} onSearch={filter} debounce={0} />
 * ```
 */
export function SearchField(props: SearchFieldProps) {
  const tokens = useComponentTokens('SearchField');

  const {
    onSearch,
    debounce,
    onSubmit,
    clearable = true,
    clearLabel = 'Cancella la ricerca',
    name,
    value,
    defaultValue,
    onChangeText,
    disabled = false,
    sx,
    ...rest
  } = props;

  const wait = debounce ?? tokens.debounce;

  // The reactive snapshot, so the cross appears for a value written from
  // elsewhere and not only for one that was typed.
  const fieldMeta = useDashFieldMeta(name ?? '');
  const [typed, setTyped] = useState(value ?? defaultValue ?? '');

  const text = value ?? (name ? ((fieldMeta.value as string | undefined) ?? '') : typed);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // The half of this that gets forgotten: a query fired from a screen
  // that has gone is a query nobody is waiting for, and on a slow list
  // it is a state update on an unmounted tree.
  useEffect(() => cancel, []);

  const change = (next: string) => {
    if (value === undefined && !name) setTyped(next);
    onChangeText?.(next);

    cancel();
    if (!onSearch) return;
    if (wait <= 0) {
      onSearch(next);
      return;
    }
    timer.current = setTimeout(() => onSearch(next), wait);
  };

  const submit = () => {
    // Somebody who pressed search has stopped typing by definition.
    cancel();
    onSubmit?.(text);
    onSearch?.(text);
  };

  const clear = () => {
    change('');
    onSubmit?.('');
  };

  const showClear = clearable && text.length > 0 && !disabled;

  return (
    <TextField
      name={name}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChangeText={change}
      onSubmitEditing={submit}
      // `search` on the keyboard, and the keyboard stays up: a list that
      // narrows as you refine the words is the point.
      returnKeyType="search"
      // The difference between looking for `useRef` and looking for
      // `Useref`.
      autoCorrect={false}
      autoCapitalize="none"
      startAdornment={
        <Magnifier
          size={tokens.glyph.size}
          thickness={tokens.glyph.thickness}
          handle={tokens.glyph.handle}
          color={tokens.glyph.color}
          style={sx?.glyph}
        />
      }
      endAdornment={
        showClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            onPress={clear}
            hitSlop={tokens.clear.hitSlop}
            style={[
              {
                width: tokens.clear.size,
                height: tokens.clear.size,
                alignItems: 'center',
                justifyContent: 'center',
              },
              sx?.clear,
            ]}
          >
            <View
              style={{
                position: 'absolute',
                width: tokens.clear.size,
                height: tokens.clear.thickness,
                backgroundColor: tokens.clear.color,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: tokens.clear.size,
                height: tokens.clear.thickness,
                backgroundColor: tokens.clear.color,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </Pressable>
        ) : undefined
      }
      {...rest}
      sx={sx}
    />
  );
}
