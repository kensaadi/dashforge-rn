import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import type { FieldRegistration } from '@dashforge/ui-core';
import { useAccessState } from '../../hooks/useAccessState';
import { useStandaloneFieldWarning } from '../../hooks/useStandaloneFieldWarning';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { useFormField } from '../_shared/useFormField';
import type { OTPFieldProps } from './otpField.types';

/**
 * The boxes for a code that arrived by message.
 *
 * **One input behind six boxes, not six inputs.** Six would look the
 * same and behave nothing like it: backspace in an empty box has to
 * move to the one before and delete what is in it, paste has to fill
 * all of them at once, and the keyboard has to stay put while focus
 * moves. Every one of those is a fight with six inputs and free with
 * one, so the input is a single invisible field and the boxes are
 * drawing.
 *
 * **It asks the platform for the code.** `oneTimeCode` on iOS and
 * `sms-otp` on Android are what put the number above the keyboard, or
 * fill the field outright, when the message arrives. It is one prop
 * each and it is the whole reason somebody does not have to leave the
 * app, read a message and come back.
 *
 * `onComplete` is the one to verify from: a code is only a code when it
 * is complete, and checking a partial one is a request that can only
 * fail.
 *
 * @example
 * ```tsx
 * <OTPField label="Codice" onComplete={verify} />
 * <OTPField name="otp" length={4} rules={{ required: true }} />
 * ```
 */
export function OTPField(props: OTPFieldProps) {
  const themeDefaults = useComponentDefaults('OTPField');
  const tokens = useComponentTokens('OTPField');
  const theme = useTheme();

  const {
    length = 6,
    name,
    rules,
    label,
    helperText,
    required = false,
    error,
    disabled = false,
    value: controlledValue,
    defaultValue,
    onChangeText,
    onComplete,
    autoFocus = true,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as OTPFieldProps;

  const { bridge, isFormMode, fieldMeta, register, commit } = useFormField(name, rules);
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const [ownValue, setOwnValue] = useState(defaultValue ?? '');
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInputInstance>(null);
  useStandaloneFieldWarning('OTPField', name, isFormMode, controlledValue, onChangeText);

  let registration: FieldRegistration | null = null;
  let invalid = error ?? false;
  let helper = helperText;
  let code = controlledValue ?? ownValue;

  if (isFormMode && bridge && name) {
    registration = register();
    const validation = resolveValidationState(name, bridge, error, helperText);
    invalid = validation.invalid;
    helper = validation.helperText;
    if (controlledValue === undefined) {
      const v = fieldMeta.value;
      code = v == null ? '' : String(v);
    }
  }

  // Announced once, when it fills. A `useEffect` and not a branch in the
  // change handler, so a code that arrived by autofill or by a
  // programmatic write is announced too.
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (code.length !== length) {
      announced.current = null;
      return;
    }
    if (announced.current === code) return;
    announced.current = code;
    onComplete?.(code);
  }, [code, length, onComplete]);

  if (!isVisible || !accessState.visible) return null;

  const inert = disabled || accessState.disabled || accessState.readonly;

  const change = (next: string) => {
    // Digits only and never longer than the code: a paste of "Il tuo
    // codice è 123456" leaves 123456, which is what was meant.
    const cleaned = next.replace(/\D/g, '').slice(0, length);
    if (cleaned === code) return;
    if (isFormMode) commit(registration, cleaned);
    if (controlledValue === undefined && !isFormMode) setOwnValue(cleaned);
    onChangeText?.(cleaned);
  };

  const characters = Array.from({ length }, (_, i) => code[i] ?? '');
  const active = Math.min(code.length, length - 1);

  return (
    <View {...rest} style={[{ gap: tokens.stackGap }, sx?.root]}>
      {label ? (
        <Text style={[{ ...tokens.typography.label, color: tokens.color.label }, sx?.label]}>
          {label}
          {required ? (
            <Text style={{ color: tokens.color.required }} accessibilityElementsHidden>
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : null}

      <Pressable
        // One target with one name. Six boxes announced one by one would
        // be six elements saying nothing, and the thing a reader wants
        // is the field.
        accessible
        accessibilityRole="none"
        accessibilityLabel={label}
        accessibilityValue={{ text: code.length ? code.split('').join(' ') : undefined }}
        accessibilityState={{ disabled: inert }}
        accessibilityHint={invalid ? helper : undefined}
        disabled={inert}
        onPress={() => input.current?.focus()}
        style={[{ flexDirection: 'row', gap: tokens.gap }, sx?.boxes]}
      >
        {characters.map((character, i) => {
          const here = focused && i === active && !inert;
          return (
            <View
              key={i}
              style={[
                {
                  width: tokens.box.width,
                  height: tokens.box.height,
                  borderRadius: tokens.box.radius,
                  borderWidth: tokens.box.borderWidth,
                  borderColor: inert
                    ? tokens.color.borderDisabled
                    : invalid
                      ? tokens.color.borderInvalid
                      : here
                        ? tokens.color.borderActive
                        : tokens.color.border,
                  backgroundColor: tokens.color.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                inert ? { opacity: theme.semantic.opacity.disabled } : null,
                sx?.box,
              ]}
            >
              {character ? (
                <Text
                  style={[
                    {
                      ...tokens.typography.digit,
                      color: inert ? tokens.color.digitDisabled : tokens.color.digit,
                    },
                    sx?.digit,
                  ]}
                >
                  {character}
                </Text>
              ) : here ? (
                <View
                  style={{
                    width: tokens.caret.width,
                    height: tokens.caret.height,
                    backgroundColor: tokens.caret.color,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </Pressable>

      {/*
        The field itself, invisible and one point wide rather than
        `display: none`: a field that is not laid out cannot be focused,
        and one that cannot be focused cannot be autofilled either.
      */}
      <TextInput
        ref={input}
        value={code}
        onChangeText={change}
        editable={!inert}
        autoFocus={autoFocus && !inert}
        keyboardType="number-pad"
        maxLength={length}
        // The reason somebody does not have to leave the app, read a
        // message and come back.
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          setFocused(false);
          if (isFormMode) registration?.onBlur?.(event);
        }}
        // Announced by the boxes above, which are one element with the
        // whole code in them.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />

      {helper ? (
        <Text
          style={[
            {
              ...tokens.typography.helper,
              color: invalid ? tokens.color.helperInvalid : tokens.color.helper,
            },
            sx?.helper,
          ]}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
