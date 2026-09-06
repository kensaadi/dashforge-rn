import { useContext, useEffect, useId, useRef, useState } from 'react';
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
import { checkboxRecipe } from './checkbox.variants';
import type { CheckboxProps } from './checkbox.types';

/**
 * A checkbox, in a form or on its own.
 *
 * **The first control here whose value is not a string.** `TextField`
 * proved the form bridge for text; this one proves it for a boolean,
 * which is where a renderer usually turns out to have been coercing
 * everything through `String()` without anybody noticing. The value that
 * reaches the payload is `true` or `false`, and there is a test that
 * reads it back out of a submitted form to say so.
 *
 * The mark is drawn rather than imported: a tick is two edges of a box
 * turned forty-five degrees, and a library that ships three dependencies
 * is not going to add an icon set for one glyph.
 *
 * The whole row is the target, label included, because a word is easier
 * to hit than a twenty-point square, and `hitSlop` takes even the small
 * size past the forty-four point floor.
 *
 * @example
 * ```tsx
 * <DashFormProvider>
 *   <Checkbox name="newsletter" label="Iscrivimi alla newsletter" />
 * </DashFormProvider>
 *
 * <Checkbox checked={all} indeterminate={some} onCheckedChange={setAll} label="Tutti" />
 * ```
 */
export function Checkbox(props: CheckboxProps) {
  const themeDefaults = useComponentDefaults('Checkbox');
  const tokens = useComponentTokens('Checkbox');

  const {
    name,
    rules,
    label,
    helperText,
    required = false,
    error,
    disabled = false,
    size = 'md',
    checked: controlledChecked,
    defaultChecked = false,
    indeterminate = false,
    onCheckedChange,
    access,
    visibleWhen,
    sx,
    ...rest
  } = { ...themeDefaults, ...props } as CheckboxProps;

  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  const isFormMode = Boolean(name && bridge?.register);

  const fieldMeta = useDashFieldMeta(name ?? '');
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const labelId = useId();
  // Uncontrolled, and only consulted when nobody else owns the value.
  const [ownChecked, setOwnChecked] = useState(defaultChecked);
  useStandaloneFieldWarning(
    'Checkbox',
    name,
    isFormMode,
    controlledChecked,
    onCheckedChange,
  );

  // Seed the engine once, so an untouched box still lands in the payload.
  //
  // On the web a registered checkbox has a DOM element whose `checked`
  // reflects false; here there is no element to reflect anything, so
  // without this the key is simply absent and a backend cannot tell
  // "unchecked" from "the field was never there". Unchecked is a real
  // answer, not an absence.
  //
  // `setValue` and not a dirty write: react-hook-form leaves the form
  // clean unless asked otherwise, so this does not turn a freshly
  // mounted form into a modified one. There is a test that says so.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !isFormMode || !bridge || !name) return;
    if (bridge.getValue?.(name) !== undefined) return;
    seededRef.current = true;
    bridge.setValue?.(name, defaultChecked);
  });

  // StrictMode-safe unregister, as on TextField: the double invoke in
  // development mounts, unmounts and mounts again, so an eager
  // unregister would drop a field that is about to be alive.
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

  const inactive = disabled || accessState.disabled;
  // A checkbox has no read-only rendering of its own: a box you can see
  // but not change is a disabled box. Same collapse as Button.
  const inert = inactive || accessState.readonly;

  let registration: FieldRegistration | null = null;
  let invalid = error ?? false;
  let helper = helperText;
  let checked = controlledChecked ?? ownChecked;

  if (isFormMode && bridge && name) {
    registration = bridge.register(name, rules);
    const validation = resolveValidationState(name, bridge, error, helperText);
    invalid = validation.invalid;
    helper = validation.helperText;
    if (controlledChecked === undefined) {
      // The reactive snapshot, never `bridge.getValue`, which is an eager
      // read with no subscription. Coerced with `Boolean` and not
      // `String`: an engine that has never seen this field yields
      // `undefined`, and the string of that is `"undefined"`, which is
      // truthy. That is the mistake this component exists to not make.
      checked = Boolean(fieldMeta.value);
    }
  }

  // Mixed only reads as mixed while the box is not checked; once it is,
  // it is checked and there is nothing partial left to say.
  const mixed = indeterminate && !checked;
  // A mixed box is a filled box: it carries a mark, so it takes the same
  // ground and the same mark colour as a checked one. Deriving the state
  // from `checked` alone left the indeterminate bar with no colour at
  // all, which is to say invisible.
  const marked = checked || mixed;

  const styles = checkboxRecipe(tokens)({
    size,
    state: inert ? (marked ? 'disabledOn' : 'disabled') : marked ? 'on' : 'off',
    invalid,
  });

  const toggle = () => {
    // From mixed the answer is on, which is what a parent box over a
    // partly-selected list should do.
    const next = mixed ? true : !checked;
    if (isFormMode && bridge && name) {
      bridge.setValue?.(name, next);
      void registration?.onChange?.({ target: { name, value: next } });
      void registration?.onBlur?.({ target: { name, value: next } });
    }
    if (controlledChecked === undefined && !isFormMode) setOwnChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <View style={[styles.root, sx?.root]}>
      <Pressable
        accessibilityRole="checkbox"
        // `'mixed'` rather than `false`: a box that only looks
        // indeterminate tells a screen reader it is unchecked, which is a
        // wrong answer rather than a missing one.
        accessibilityState={{ checked: mixed ? 'mixed' : checked, disabled: inert }}
        accessibilityLabelledBy={label ? labelId : undefined}
        accessibilityHint={invalid ? helper : undefined}
        disabled={inert}
        hitSlop={tokens.hitSlop[size]}
        onPress={toggle}
        {...rest}
        style={[styles.row, sx?.row]}
      >
        <View
          style={[
            styles.box,
            // The box sits level with the first line of the label rather
            // than with the block, which is what keeps it in place when
            // the label wraps.
            label ? { marginTop: Math.max(0, (offsetOf(styles) - tokens.box[size]) / 2) } : null,
            sx?.box,
          ]}
        >
          {mixed ? <View style={styles.bar} /> : null}
          {checked && !mixed ? <View style={styles.tick} /> : null}
        </View>
        {label ? (
          <Text nativeID={labelId} style={[styles.label, sx?.label]}>
            {label}
            {required ? (
              <Text
                style={{ color: tokens.color.required }}
                accessibilityElementsHidden
              >
                {' *'}
              </Text>
            ) : null}
          </Text>
        ) : null}
      </Pressable>
      {helper ? (
        <Text style={[styles.helper, sx?.helper]}>{helper}</Text>
      ) : null}
    </View>
  );
}

/** The label's line box, which is what the checkbox lines up against. */
function offsetOf(styles: { label: { lineHeight?: number; fontSize?: number } }): number {
  return styles.label.lineHeight ?? styles.label.fontSize ?? 0;
}
