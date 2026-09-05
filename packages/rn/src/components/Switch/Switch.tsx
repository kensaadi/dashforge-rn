import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { DashFormContext } from '@dashforge/ui-core';
import type { DashFormBridge, FieldRegistration } from '@dashforge/ui-core';
import { useDashFieldMeta } from '@dashforge/forms';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useStandaloneFieldWarning } from '../../hooks/useStandaloneFieldWarning';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { switchRecipe } from './switch.variants';
import type { SwitchProps } from './switch.types';

/**
 * A switch, for a setting that takes effect where it stands.
 *
 * **The difference from `Checkbox` is when the answer counts**, not how
 * it looks. A checkbox is a choice that will be submitted with the rest
 * of a form; a switch is a thing turning on now. That is why it has no
 * indeterminate state: a setting is on or it is off, and there is no
 * partial answer to give.
 *
 * **Drawn rather than the platform's own.** React Native's `Switch`
 * exposes a track colour and a thumb colour and nothing else: no size,
 * no radius, no border, no states. Half of it would be unreachable from
 * the theme and the three sizes could not exist, so it is built here out
 * of the same tokens as everything else.
 *
 * The value it puts in a form's payload is a boolean, and an untouched
 * switch still lands there as `false`, for the same reason it does on
 * `Checkbox`: off is an answer, not an absence.
 *
 * @example
 * ```tsx
 * <Switch checked={dark} onCheckedChange={setDark} label="Tema scuro" />
 * <Switch name="notify" label="Notifiche push" helperText="Solo per gli ordini." />
 * ```
 */
export function Switch(props: SwitchProps) {
  const themeDefaults = useComponentDefaults('Switch');
  const tokens = useComponentTokens('Switch');

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
    onCheckedChange,
    side = 'end',
    access,
    visibleWhen,
    sx,
    ...rest
  } = { ...themeDefaults, ...props } as SwitchProps;

  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  const isFormMode = Boolean(name && bridge?.register);

  const fieldMeta = useDashFieldMeta(name ?? '');
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const reduceMotion = useReduceMotion();
  const labelId = useId();
  const [ownChecked, setOwnChecked] = useState(defaultChecked);
  useStandaloneFieldWarning(
    'Switch',
    name,
    isFormMode,
    controlledChecked,
    onCheckedChange,
  );

  // One value drives both the travel and the colour. Both interpolate
  // from it, which is why neither is a variant: a recipe would compile
  // two states the component would then have to ignore.
  //
  // Deliberately not on the native driver. `backgroundColor` cannot go
  // there, and a thumb sliding while its track changed colour a frame
  // apart is worse than a hundred and twenty milliseconds of work on the
  // JS thread for a control the size of a thumbnail.
  const progress = useRef(new Animated.Value(defaultChecked ? 1 : 0)).current;

  // Seeded once, so an untouched switch still lands in the payload.
  // Off is an answer, not an absence. `setValue` leaves the form clean.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !isFormMode || !bridge || !name) return;
    if (bridge.getValue?.(name) !== undefined) return;
    seededRef.current = true;
    bridge.setValue?.(name, defaultChecked);
  });

  // StrictMode-safe unregister, as on the other two fields.
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

  const inactive = disabled || accessState.disabled;
  // A switch you can see but not move is a disabled switch: there is no
  // read-only rendering of its own. Same collapse as Button.
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
      // `Boolean`, never `String`: the string of `undefined` is
      // `"undefined"`, which is truthy.
      checked = Boolean(fieldMeta.value);
    }
  }

  // Drives the animation from whatever now owns the state, so a switch
  // moved by the engine or by a parent travels the same way as one moved
  // by a finger.
  useEffect(() => {
    const to = checked ? 1 : 0;
    if (reduceMotion) {
      progress.setValue(to);
      return;
    }
    Animated.timing(progress, {
      toValue: to,
      duration: tokens.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [checked, reduceMotion, progress, tokens.duration]);

  if (!isVisible || !accessState.visible) return null;

  const styles = switchRecipe(tokens)({ size, side, disabled: inert, invalid });
  const travel = tokens.track[size].w - tokens.thumb[size] - tokens.inset[size] * 2;

  const toggle = () => {
    const next = !checked;
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
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled: inert }}
        accessibilityLabelledBy={label ? labelId : undefined}
        accessibilityHint={invalid ? helper : undefined}
        disabled={inert}
        hitSlop={tokens.hitSlop[size]}
        onPress={toggle}
        {...rest}
        style={[styles.row, sx?.row]}
      >
        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: inert
                  ? [tokens.color.trackOffDisabled, tokens.color.trackOnDisabled]
                  : [
                      // Invalid recolours the off state only: once the
                      // switch is on there is nothing left to correct,
                      // and a red track under a positive answer is a
                      // contradiction.
                      invalid ? tokens.color.trackInvalid : tokens.color.trackOff,
                      tokens.color.trackOn,
                    ],
              }),
              paddingHorizontal: tokens.inset[size],
            },
            sx?.track,
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: inert ? tokens.color.thumbDisabled : tokens.color.thumb,
                left: tokens.inset[size],
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, travel],
                    }),
                  },
                ],
              },
              sx?.thumb,
            ]}
          />
        </Animated.View>
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
      {helper ? <Text style={[styles.helper, sx?.helper]}>{helper}</Text> : null}
    </View>
  );
}
