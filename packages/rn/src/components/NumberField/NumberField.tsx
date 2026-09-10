import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useComponentTokens } from '../../theme/useComponentTokens';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { useFormField } from '../_shared/useFormField';
import { TextField } from '../TextField/TextField';
import type { NumberFieldProps } from './numberField.types';

/**
 * Reads what somebody typed, and says so honestly when it is not a
 * number yet.
 *
 * `-`, `3.` and `3,` are all things a person types on the way to a
 * number and none of them parse. Returning `undefined` for them is what
 * lets the draft survive: the field keeps the characters, the engine
 * gets nothing, and neither has to lie.
 *
 * Both separators are accepted because both are typed. An Italian
 * keyboard offers a comma and an English one a full stop, and a field
 * that only understands one of them is a field half the users fight.
 *
 * @internal
 */
export function parseNumber(text: string, integer: boolean): number | undefined {
  const cleaned = text.trim().replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
    return undefined;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return undefined;
  return integer ? Math.trunc(value) : value;
}

/**
 * Puts a number back on the screen.
 *
 * `undefined` is an empty field and not a zero, which is the same
 * distinction `onValueChange` makes.
 *
 * @internal
 */
export function formatNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

/** Keeps a value inside its fence, ignoring a fence that was not given. */
function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

/**
 * A field for a quantity, a price, an age.
 *
 * **It exists because a form payload should hold a number.** A
 * `TextField` with a numeric keyboard writes `"3"`, and then a rule that
 * says `min: 1` compares a string, an API receives a string, and
 * somebody fixes it with a `Number()` at the call site of every field.
 * This one writes `3`, and writes `undefined` for an empty field rather
 * than `0` or `NaN`: an empty field is the absence of an answer, and a
 * quantity of zero is an answer.
 *
 * **What is typed and what is stored are two different things.** While
 * the field has the caret it keeps the characters exactly as they
 * arrived, because `-`, `3.` and `3,` are all steps on the way to a
 * number and a field that reformats on every keystroke takes the second
 * character away as the first is typed. The number is parsed and sent
 * on as it goes; the text is only rewritten when the field is left.
 *
 * `min` and `max` are applied on leaving for the same reason: clamping
 * mid-keystroke means somebody typing `10` into a field with a minimum
 * of `5` watches their `1` turn into a `5`.
 *
 * It is a `TextField` underneath, so the label, the helper, the
 * validation, the adornments, `access` and `visibleWhen` are the same
 * code rather than a second copy of it.
 *
 * @example
 * ```tsx
 * <NumberField name="quantity" label="Quantità" min={1} max={99} steppers integer />
 * <NumberField name="price" label="Prezzo" min={0} />
 * ```
 */
export function NumberField(props: NumberFieldProps) {
  const tokens = useComponentTokens('TextField');

  const {
    name,
    rules,
    value: controlledValue,
    defaultValue,
    onValueChange,
    min,
    max,
    step = 1,
    integer = false,
    steppers = false,
    disabled = false,
    error,
    helperText,
    size = 'md',
    // A field in a form is a block like the others. `fullWidth={false}`
    // is the compact case, and the input keeps a floor of its own so
    // that the box does not collapse to the width of the steppers.
    fullWidth = true,
    onBlur,
    access,
    visibleWhen,
    sx,
    ...rest
  } = props;

  const { bridge, isFormMode, fieldMeta, register, commit } = useFormField(name, rules);
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  /** The characters on screen, which are not always a number. */
  const [draft, setDraft] = useState(() => formatNumber(controlledValue ?? defaultValue));
  const editing = useRef(false);

  // The value can change under the field: a form reset, a write from
  // elsewhere, a controlled parent. Whatever is on screen is only the
  // authority while somebody is typing into it.
  const external = isFormMode
    ? ((fieldMeta.value ?? undefined) as number | undefined)
    : controlledValue;
  useEffect(() => {
    if (editing.current) return;
    if (external === undefined && controlledValue === undefined && !isFormMode) return;
    setDraft(formatNumber(external));
  }, [external, controlledValue, isFormMode]);

  if (!isVisible || !accessState.visible) return null;

  const registration = register();
  const validation = isFormMode && bridge && name
    ? resolveValidationState(name, bridge, error, helperText)
    : { invalid: error ?? false, helperText };

  const inactive = disabled || accessState.disabled;
  const current = parseNumber(draft, integer);

  const publish = (next: number | undefined) => {
    commit(registration, next);
    onValueChange?.(next);
  };

  const type = (text: string) => {
    editing.current = true;
    setDraft(text);
    publish(parseNumber(text, integer));
  };

  const settle = () => {
    editing.current = false;
    const parsed = parseNumber(draft, integer);
    if (parsed === undefined) {
      setDraft('');
      publish(undefined);
      return;
    }
    const fenced = clamp(parsed, min, max);
    setDraft(formatNumber(fenced));
    if (fenced !== parsed) publish(fenced);
  };

  const nudge = (by: number) => {
    if (inactive || accessState.readonly) return;
    // An empty field's first press lands on the floor when there is one,
    // and on one step otherwise. Adding a step to the floor instead
    // would mean a quantity with a minimum of one starts at two, which
    // is the wrong first answer to "how many".
    const landed =
      current === undefined
        ? (min ?? (by > 0 ? step : -step))
        : integer
          ? Math.trunc(current + by)
          : current + by;
    const next = clamp(landed, min, max);
    editing.current = false;
    setDraft(formatNumber(next));
    publish(next);
  };

  const atFloor = min !== undefined && current !== undefined && current <= min;
  const atCeiling = max !== undefined && current !== undefined && current >= max;

  const bar = { height: 2, width: 12, borderRadius: 1 } as const;
  const stepperStyle = {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  } as const;

  const stepperButtons = steppers ? (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, sx?.steppers]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diminuisci"
        accessibilityState={{ disabled: inactive || atFloor }}
        disabled={inactive || atFloor}
        onPress={() => nudge(-step)}
        style={[stepperStyle, sx?.stepper]}
      >
        <View
          style={{
            ...bar,
            backgroundColor: inactive || atFloor ? tokens.color.textDisabled : tokens.color.text,
          }}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumenta"
        accessibilityState={{ disabled: inactive || atCeiling }}
        disabled={inactive || atCeiling}
        onPress={() => nudge(step)}
        style={[stepperStyle, sx?.stepper]}
      >
        <View
          style={{
            ...bar,
            backgroundColor:
              inactive || atCeiling ? tokens.color.textDisabled : tokens.color.text,
          }}
        />
        <View
          style={{
            ...bar,
            position: 'absolute',
            transform: [{ rotate: '90deg' }],
            backgroundColor:
              inactive || atCeiling ? tokens.color.textDisabled : tokens.color.text,
          }}
        />
      </Pressable>
    </View>
  ) : undefined;

  return (
    <TextField
      // Deliberately no `name`: the field underneath stays an ordinary
      // controlled input and this component owns the conversation with
      // the engine, because that conversation is about a number and
      // `TextField`'s is about a string.
      value={draft}
      onChangeText={type}
      onBlur={(event) => {
        settle();
        onBlur?.(event);
      }}
      // Whole numbers get a keyboard with no separator on it at all,
      // which is one fewer thing to reject.
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      disabled={disabled}
      error={validation.invalid}
      helperText={validation.helperText}
      size={size}
      fullWidth={fullWidth}
      endAdornment={stepperButtons}
      // The reader gets the value and the two moves, since the steppers
      // are the part a gesture cannot reach.
      accessibilityValue={{ now: current, min, max }}
      access={access}
      {...rest}
      sx={{
        ...sx,
        // Room for three digits whatever the type scale says. Without a
        // floor an empty input has no intrinsic width, and a compact
        // field shrinks until the steppers are the only thing left.
        input: [{ minWidth: (tokens.typography.input.fontSize ?? 16) * 3 }, sx?.input],
      }}
    />
  );
}
