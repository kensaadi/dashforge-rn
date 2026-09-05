import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DashFormContext } from '@dashforge/ui-core';
import type { DashFormBridge, FieldRegistration } from '@dashforge/ui-core';
import { useDashFieldMeta } from '@dashforge/forms';
import { useAccessState } from '../../hooks/useAccessState';
import { useStandaloneFieldWarning } from '../../hooks/useStandaloneFieldWarning';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { radioGroupRecipe } from './radioGroup.variants';
import type {
  RadioGroupProps,
  RadioOptionProps,
  RadioValue,
} from './radioGroup.types';

/**
 * What the group tells its options.
 *
 * All of it, because an option owns nothing: not the value, not the
 * size, not whether it is disabled. It is a way of offering an answer
 * that the group holds.
 */
interface RadioContext {
  value: RadioValue | undefined;
  select: (value: RadioValue) => void;
  size: NonNullable<RadioGroupProps['size']>;
  orientation: NonNullable<RadioGroupProps['orientation']>;
  disabled: boolean;
  invalid: boolean;
}

const RadioCtx = createContext<RadioContext | null>(null);

/**
 * One answer in a `RadioGroup`.
 *
 * A descriptor with a body: it renders itself, but everything it needs
 * comes from the group. Outside one it warns and renders nothing, since
 * a radio with nothing to belong to is a checkbox that cannot be
 * unchecked.
 *
 * @example
 * ```tsx
 * <RadioGroup.Option value="standard" label="Standard, 3 giorni" />
 * ```
 */
export function RadioOption(props: RadioOptionProps) {
  const tokens = useComponentTokens('RadioGroup');
  const group = useContext(RadioCtx);
  const { value, label, disabled = false, access, visibleWhen, sx, ...rest } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (__DEV__ && group === null) {
    console.warn(
      '[@dashforge/rn] <RadioGroup.Option> was rendered outside a <RadioGroup>, so ' +
        'nothing holds the answer it offers and it renders nothing.',
    );
  }

  if (group === null) return null;
  if (!isVisible || !accessState.visible) return null;

  const checked = group.value === value;
  const inert =
    disabled || group.disabled || accessState.disabled || accessState.readonly;

  const styles = radioGroupRecipe(tokens)({
    size: group.size,
    orientation: group.orientation,
    state: inert ? (checked ? 'disabledOn' : 'disabled') : checked ? 'on' : 'off',
    invalid: group.invalid,
  });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: inert }}
      disabled={inert}
      hitSlop={tokens.hitSlop[group.size]}
      // Choosing again is not unchoosing: a group holds one answer and
      // there is no way back to none from inside it.
      onPress={() => group.select(value)}
      {...rest}
      style={[styles.row, sx?.row]}
    >
      <View
        style={[
          styles.circle,
          label
            ? {
                marginTop: Math.max(
                  0,
                  ((styles.label.lineHeight ?? styles.label.fontSize ?? 0) -
                    tokens.circle[group.size]) /
                    2,
                ),
              }
            : null,
          sx?.circle,
        ]}
      >
        {checked ? <View style={[styles.dot, sx?.dot]} /> : null}
      </View>
      {label ? <Text style={[styles.label, sx?.label]}>{label}</Text> : null}
    </Pressable>
  );
}
RadioOption.displayName = 'RadioGroup.Option';

/**
 * A set of answers, of which one holds.
 *
 * **The group registers, the options do not.** One field holds one
 * answer, and this is the shape that separates it from every control so
 * far: `TextField`, `Checkbox` and `Switch` each own their field, while
 * here several controls share one and none of them owns it. An option
 * carries no name, no rules and no registration; it offers a value and
 * the group decides what that means.
 *
 * **It does not seed itself**, unlike `Checkbox` and `Switch`. An
 * unchecked box is an answer, "no"; an untouched radio group is the
 * absence of one, and writing a default would be inventing a choice the
 * user did not make. A group that should start somewhere says so with
 * `defaultValue`.
 *
 * The value reaches the payload unchanged, string or number, since a set
 * of options is as likely to be keyed by id as by slug.
 *
 * @example
 * ```tsx
 * <RadioGroup name="shipping" label="Consegna" rules={{ required: true }}>
 *   <RadioGroup.Option value="standard" label="Standard, 3 giorni" />
 *   <RadioGroup.Option value="express" label="Express, domani" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup(props: RadioGroupProps) {
  const themeDefaults = useComponentDefaults('RadioGroup');
  const tokens = useComponentTokens('RadioGroup');

  const {
    name,
    rules,
    label,
    helperText,
    required = false,
    error,
    disabled = false,
    size = 'md',
    orientation = 'vertical',
    value: controlledValue,
    defaultValue,
    onValueChange,
    children,
    access,
    visibleWhen,
    sx,
    ...rest
  } = { ...themeDefaults, ...props } as RadioGroupProps;

  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  const isFormMode = Boolean(name && bridge?.register);

  const fieldMeta = useDashFieldMeta(name ?? '');
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const legendId = useId();
  const [ownValue, setOwnValue] = useState<RadioValue | undefined>(defaultValue);
  useStandaloneFieldWarning(
    'RadioGroup',
    name,
    isFormMode,
    controlledValue,
    onValueChange,
  );

  // StrictMode-safe unregister, as on the other fields.
  const unregisterRef = useRef({ bridge, name });
  unregisterRef.current = { bridge, name };
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const { bridge: b, name: n } = unregisterRef.current;
      if (!n) return;
      void Promise.resolve().then(() => {
        if (!mountedRef.current) b?.unregister?.(n);
      });
    };
  }, []);

  if (!isVisible || !accessState.visible) return null;

  const inert = disabled || accessState.disabled || accessState.readonly;

  let registration: FieldRegistration | null = null;
  let invalid = error ?? false;
  let helper = helperText;
  let value = controlledValue ?? ownValue;

  if (isFormMode && bridge && name) {
    registration = bridge.register(name, rules);
    const validation = resolveValidationState(name, bridge, error, helperText);
    invalid = validation.invalid;
    helper = validation.helperText;
    if (controlledValue === undefined) {
      // The reactive snapshot, and no coercion: the value goes in and
      // comes out as it was given, string or number, because a set of
      // options is as likely to be keyed by id as by slug.
      const v = fieldMeta.value;
      value = v as RadioValue | undefined;
    }
  }

  const styles = radioGroupRecipe(tokens)({ size, orientation, invalid });

  const select = (next: RadioValue) => {
    if (isFormMode && bridge && name) {
      bridge.setValue?.(name, next);
      void registration?.onChange?.({ target: { name, value: next } });
      void registration?.onBlur?.({ target: { name, value: next } });
    }
    if (controlledValue === undefined && !isFormMode) setOwnValue(next);
    onValueChange?.(next);
  };

  return (
    <View
      // Announced as one thing with a name, so the question is read once
      // before the answers rather than leaving four labels with nothing
      // to belong to.
      accessibilityRole="radiogroup"
      accessibilityLabelledBy={label ? legendId : undefined}
      {...rest}
      style={[styles.root, sx?.root]}
    >
      {label ? (
        <Text nativeID={legendId} style={[styles.legend, sx?.legend]}>
          {label}
          {required ? (
            <Text style={{ color: tokens.color.required }} accessibilityElementsHidden>
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : null}
      <View style={[styles.options, sx?.options]}>
        <RadioCtx.Provider
          value={{ value, select, size, orientation, disabled: inert, invalid }}
        >
          {children}
        </RadioCtx.Provider>
      </View>
      {helper ? <Text style={[styles.helper, sx?.helper]}>{helper}</Text> : null}
    </View>
  );
}

RadioGroup.Option = RadioOption;
