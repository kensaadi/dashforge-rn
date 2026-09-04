import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { DashFormContext } from '@dashforge/ui-core';
import type { DashFormBridge, FieldRegistration } from '@dashforge/ui-core';
import { useDashFieldMeta } from '@dashforge/forms';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { textFieldRecipe } from './textField.variants';
import type { TextFieldProps } from './textField.types';

/**
 * A text field, in a form or on its own.
 *
 * **Two modes, decided by whether it has a `name` and a `<DashForm>`
 * around it.** With both, it registers with the engine, reads its value
 * from there and reports validation. With neither it is an ordinary
 * controlled input. The prop surface is identical either way, so moving
 * a field into a form is adding a `name`, not rewriting the call site.
 *
 * @example
 * ```tsx
 * <DashForm onSubmit={save}>
 *   <TextField name="email" label="Email" rules={{ required: true }} />
 *   <TextField name="vat" label="P.IVA" visibleWhen={(e) => e.getValue('type') === 'business'} />
 * </DashForm>
 *
 * <TextField label="Cerca" value={q} onChangeText={setQ} />
 * ```
 */
export function TextField(props: TextFieldProps) {
  const themeDefaults = useComponentDefaults('TextField');
  const tokens = useComponentTokens('TextField');

  const {
    name,
    rules,
    label,
    helperText,
    required = false,
    error,
    disabled = false,
    size = 'md',
    fullWidth = false,
    startAdornment,
    endAdornment,
    value: controlledValue,
    defaultValue,
    onChangeText,
    onFocus,
    onBlur,
    access,
    visibleWhen,
    sx,
    ...rest
  } = { ...themeDefaults, ...props } as TextFieldProps;

  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  const isFormMode = Boolean(name && bridge?.register);

  // Every hook runs unconditionally and above the early returns. The
  // field-meta subscription is a no-op without a bridge, so the
  // standalone case costs nothing rather than needing a branch.
  const fieldMeta = useDashFieldMeta(name ?? '');
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const [focused, setFocused] = useState(false);
  const labelId = useId();

  // StrictMode-safe unregister. The double invoke in development mounts,
  // unmounts and mounts again, so an eager unregister on the first
  // teardown would drop a field that is about to be alive. Deferring to
  // a microtask lets the remount win.
  const unregisterRef = useRef({ bridge, name });
  unregisterRef.current = { bridge, name };
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const { bridge: b, name: n } = unregisterRef.current;
      if (!n) return;
      // `Promise.resolve().then` rather than `queueMicrotask`: same
      // timing, and it needs no ambient global that the DOM-free lib
      // config does not have.
      void Promise.resolve().then(() => {
        if (!mountedRef.current) b?.unregister?.(n);
      });
    };
  }, []);

  if (!isVisible || !accessState.visible) return null;

  const inactive = disabled || accessState.disabled;
  // A text field *does* have a read-only state, so unlike Button it does
  // not collapse into disabled: the value stays legible and selectable,
  // it simply cannot be edited.
  const readOnly = accessState.readonly;

  let registration: FieldRegistration | null = null;
  let invalid = error ?? false;
  let helper = helperText;
  let text = controlledValue;

  if (isFormMode && bridge && name) {
    registration = bridge.register(name, rules);
    const validation = resolveValidationState(name, bridge, error, helperText);
    invalid = validation.invalid;
    helper = validation.helperText;
    if (controlledValue === undefined) {
      // Read the reactive snapshot, never `bridge.getValue`. The getter
      // is an eager read with no subscription, so the field would not
      // re-render on its own edits.
      const v = fieldMeta.value;
      text = v == null ? '' : String(v);
    }
  }

  const multiline = Boolean(rest.multiline);
  const styles = textFieldRecipe(tokens)({
    size,
    state: inactive ? 'disabled' : focused ? 'focused' : 'rest',
    invalid,
    fullWidth,
    multiline,
  });

  const handleChangeText = (next: string) => {
    if (isFormMode && bridge && name) {
      bridge.setValue?.(name, next);
      void registration?.onChange?.({ target: { name, value: next } });
    }
    onChangeText?.(next);
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

      <View style={[styles.control, sx?.control]}>
        {startAdornment}
        <TextInput
          accessibilityLabelledBy={label ? labelId : undefined}
          accessibilityLabel={label ? undefined : props.placeholder}
          accessibilityState={{ disabled: inactive }}
          // Announced rather than only coloured: a red border says
          // nothing to a screen reader, and nothing at all to a reader
          // who cannot separate red from grey.
          accessibilityHint={invalid ? helper : undefined}
          editable={!inactive && !readOnly}
          placeholderTextColor={tokens.color.placeholder}
          selectionColor={tokens.color.caret}
          cursorColor={Platform.OS === 'android' ? tokens.color.caret : undefined}
          // The platform draws its own underline on Android, with its own
          // padding and its own accent colour on focus. Neutralised here
          // so the control is ours on both platforms.
          underlineColorAndroid="transparent"
          // Android centres single-line text only from a certain version
          // on. Stating it removes the difference.
          textAlignVertical={multiline ? 'top' : 'center'}
          defaultValue={isFormMode ? undefined : defaultValue}
          value={text}
          onChangeText={handleChangeText}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (isFormMode) registration?.onBlur?.(e);
            onBlur?.(e);
          }}
          {...rest}
          style={[styles.input, sx?.input]}
        />
        {endAdornment}
      </View>

      {helper ? <Text style={[styles.helper, sx?.helper]}>{helper}</Text> : null}
    </View>
  );
}
