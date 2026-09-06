import { Children, isValidElement, useContext, useEffect, useId, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
import { Modal } from '../Modal/Modal';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import type { RadioValue } from '../RadioGroup/radioGroup.types';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { selectRecipe } from './select.variants';
import type { SelectOptionProps, SelectProps } from './select.types';

/**
 * One choice in a `Select`.
 *
 * A descriptor: the select reads `value`, `label` and `disabled` off the
 * element and renders the list itself, because it needs the labels
 * before the list is ever opened to say what is currently chosen.
 */
export function SelectOption(_props: SelectOptionProps) {
  if (__DEV__) {
    console.warn(
      '[@dashforge/rn] <Select.Option> was rendered outside a <Select>, so there is ' +
        'nothing for it to be a choice in and it renders nothing.',
    );
  }
  return null;
}
SelectOption.displayName = 'Select.Option';

/** Read the choices out of the children, in the order they were written. */
function readOptions(children: React.ReactNode): SelectOptionProps[] {
  const options: SelectOptionProps[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type !== SelectOption) {
      if (__DEV__) {
        console.warn(
          '[@dashforge/rn] <Select> ignored a child that is not a <Select.Option>.',
        );
      }
      continue;
    }
    options.push(child.props as SelectOptionProps);
  }
  return options;
}

/**
 * One answer among several, chosen from a list that opens.
 *
 * **Composed rather than drawn.** The closed control is this component's
 * own; what opens is a `Modal` with a `RadioGroup` in it, because one
 * answer among several already has a component and it already announces
 * itself as a radio group with radios inside. Drawing rows here would
 * mean a second implementation of the same idea, differing in the
 * details nobody looks at until a screen reader finds them.
 *
 * The list scrolls and the panel does not. That is the decision `Modal`
 * deliberately left to its caller, and a select is a caller with an
 * obvious answer: the heading stays, the choices move.
 *
 * Like `RadioGroup` and unlike `Checkbox`, **it does not seed itself**.
 * Nothing chosen is the absence of an answer rather than an answer, and
 * writing a default would be inventing a choice.
 *
 * @example
 * ```tsx
 * <Select name="plan" label="Piano" placeholder="Scegli">
 *   {plans.map((p) => <Select.Option key={p.id} value={p.id} label={p.name} />)}
 * </Select>
 * ```
 */
export function Select(props: SelectProps) {
  const themeDefaults = useComponentDefaults('Select');
  const tokens = useComponentTokens('Select');

  const {
    name,
    rules,
    label,
    placeholder,
    title,
    helperText,
    required = false,
    error,
    disabled = false,
    size = 'md',
    radius = 'md',
    value: controlledValue,
    defaultValue,
    onValueChange,
    children,
    access,
    visibleWhen,
    sx,
  } = { ...themeDefaults, ...props } as SelectProps;

  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  const isFormMode = Boolean(name && bridge?.register);

  const fieldMeta = useDashFieldMeta(name ?? '');
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [ownValue, setOwnValue] = useState<RadioValue | undefined>(defaultValue);
  useStandaloneFieldWarning(
    'Select',
    name,
    isFormMode,
    controlledValue,
    onValueChange,
  );

  // StrictMode-safe unregister, as on every other field.
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
      value = fieldMeta.value as RadioValue | undefined;
    }
  }

  const options = readOptions(children);
  const chosen = options.find((option) => option.value === value);
  const styles = selectRecipe(tokens)({
    size,
    radius,
    state: inert ? 'disabled' : open ? 'open' : 'rest',
    invalid,
    filled: chosen !== undefined,
  });

  const choose = (next: RadioValue) => {
    setOpen(false);
    if (isFormMode && bridge && name) {
      bridge.setValue?.(name, next);
      void registration?.onChange?.({ target: { name, value: next } });
      void registration?.onBlur?.({ target: { name, value: next } });
    }
    if (controlledValue === undefined && !isFormMode) setOwnValue(next);
    onValueChange?.(next);
  };

  return (
    <View style={[styles.root, sx?.root]}>
      {label ? (
        <Text nativeID={labelId} style={[styles.label, sx?.label]}>
          {label}
          {required ? (
            <Text style={{ color: tokens.color.required }} accessibilityElementsHidden>
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : null}

      <Pressable
        // A button that opens a list, which is what it is: there is no
        // combobox role in React Native, and calling it a button and
        // saying what it currently holds is more honest than borrowing
        // a role the platform will not support.
        accessibilityRole="button"
        accessibilityLabelledBy={label ? labelId : undefined}
        accessibilityValue={{ text: chosen?.label ?? placeholder }}
        accessibilityHint={invalid ? helper : undefined}
        accessibilityState={{ disabled: inert, expanded: open }}
        disabled={inert}
        onPress={() => setOpen(true)}
        style={[styles.trigger, sx?.trigger]}
      >
        <Text numberOfLines={1} style={[styles.value, sx?.value]}>
          {chosen?.label ?? placeholder ?? ''}
        </Text>
        <View style={styles.chevron} />
      </Pressable>

      {helper ? <Text style={[styles.helper, sx?.helper]}>{helper}</Text> : null}

      <Modal open={open} onClose={() => setOpen(false)} label={title ?? label}>
        <Modal.Header title={title ?? label ?? ''} />
        {/*
          The list scrolls and the panel does not. `Modal` leaves that to
          its caller on purpose, because only the caller knows whether
          the heading should travel with the choices.
        */}
        <ScrollView
          style={{ maxHeight: tokens.listMaxHeight }}
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          <RadioGroup value={value} onValueChange={choose} size={size}>
            {options.map((option) => (
              <RadioGroup.Option
                key={String(option.value)}
                value={option.value}
                label={option.label}
                disabled={option.disabled}
              />
            ))}
          </RadioGroup>
        </ScrollView>
      </Modal>
    </View>
  );
}

Select.Option = SelectOption;
