import { useRef, useState } from 'react';
import {
  PanResponder,
  Text,
  View,
  type LayoutChangeEvent,
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
import { useFormField } from '../_shared/useFormField';
import type { SliderProps } from './slider.types';

/**
 * Where along the rail a touch lands, as a value.
 *
 * Pulled out because it is the whole arithmetic of a slider and it is
 * the part that is wrong in most of them: the thumb has width, so the
 * travel is the rail less the thumb, and a touch at the very left has
 * to mean the floor rather than half a thumb past it.
 *
 * @internal
 */
export function valueAt(
  x: number,
  width: number,
  limits: { min: number; max: number; step: number },
): number {
  const { min, max, step } = limits;
  if (width <= 0 || max <= min) return min;

  const ratio = Math.min(Math.max(x / width, 0), 1);
  // The ends of the rail are the ends of the range, whatever the step
  // does. With a step of three in a range of ten the reachable values
  // are 0, 3, 6 and 9, and a slider whose far end means nine is one
  // where the ceiling cannot be answered at all.
  if (ratio <= 0) return min;
  if (ratio >= 1) return max;

  const raw = min + ratio * (max - min);
  if (step <= 0) return raw;

  // Rounded to the nearest step and then fenced again: a step that does
  // not divide the range evenly would otherwise let the last one land
  // past the ceiling.
  const stepped = min + Math.round((raw - min) / step) * step;
  const fenced = Math.min(Math.max(stepped, min), max);
  // Steps like 0.1 accumulate float noise, and a slider that reports
  // 0.30000000000000004 puts that in the payload.
  const decimals = (String(step).split('.')[1] ?? '').length;
  return decimals > 0 ? Number(fenced.toFixed(decimals)) : fenced;
}

/**
 * A number chosen by dragging.
 *
 * **It takes the touch at down-press**, which is the opposite of
 * `SwipeableRow` and the same as `BottomSheet`. There is nothing inside
 * a rail to press, so there is nothing to arbitrate: a touch on it is
 * always meant for it. The cost is that a vertical scroll starting
 * exactly on the rail does not scroll, which is what a native slider
 * does too.
 *
 * A tap anywhere on the rail moves the thumb there. A slider you can
 * only drag is one where reaching the far end takes a journey.
 *
 * **`onSlidingComplete` is the one to run anything expensive from.** A
 * drag across the rail reports every step it passes, and a request per
 * step is a hundred requests for one answer.
 *
 * It answers with a **number**, in the form and out of it, for the same
 * reason `NumberField` does.
 *
 * @example
 * ```tsx
 * <Slider label="Raggio" min={1} max={50} value={km} onValueChange={setKm}
 *         formatValue={(v) => `${v} km`} />
 * <Slider name="sconto" label="Sconto" max={100} step={5} />
 * ```
 */
export function Slider(props: SliderProps) {
  const themeDefaults = useComponentDefaults('Slider');
  const tokens = useComponentTokens('Slider');
  const theme = useTheme();

  const {
    name,
    rules,
    label,
    helperText,
    showValue = true,
    formatValue = String,
    min = 0,
    max = 100,
    step = 1,
    value: controlledValue,
    defaultValue,
    onValueChange,
    onSlidingComplete,
    disabled = false,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as SliderProps;

  const { bridge, isFormMode, fieldMeta, register, commit } = useFormField(name, rules);
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const [ownValue, setOwnValue] = useState<number>(defaultValue ?? min);
  const [width, setWidth] = useState(0);
  const [held, setHeld] = useState(false);
  useStandaloneFieldWarning('Slider', name, isFormMode, controlledValue, onValueChange);

  let registration: FieldRegistration | null = null;
  let value = controlledValue ?? ownValue;

  if (isFormMode && bridge && name) {
    registration = register();
    if (controlledValue === undefined) {
      const v = fieldMeta.value;
      value = typeof v === 'number' ? v : (defaultValue ?? min);
    }
  }

  /**
   * What the responder needs, kept in a ref.
   *
   * `PanResponder.create` runs once, so its callbacks close over the
   * first render's values forever.
   */
  const live = useRef({ width: 0, min, max, step, inert: false, publish: (_v: number) => {},
    finish: (_v: number) => {} });

  const responder = useRef(
    PanResponder.create({
      // At down-press. There is nothing inside a rail to press, so there
      // is nothing to arbitrate, and it is what makes a tap on the rail
      // land the thumb there rather than needing a drag first.
      onStartShouldSetPanResponder: () => !live.current.inert,
      onMoveShouldSetPanResponder: () => !live.current.inert,
      onPanResponderGrant: (event) => {
        const { width: w, min: lo, max: hi, step: s, publish } = live.current;
        publish(valueAt(event.nativeEvent.locationX, w, { min: lo, max: hi, step: s }));
      },
      onPanResponderMove: (event) => {
        const { width: w, min: lo, max: hi, step: s, publish } = live.current;
        publish(valueAt(event.nativeEvent.locationX, w, { min: lo, max: hi, step: s }));
      },
      onPanResponderRelease: (event) => {
        const { width: w, min: lo, max: hi, step: s, finish } = live.current;
        finish(valueAt(event.nativeEvent.locationX, w, { min: lo, max: hi, step: s }));
      },
      // Keep it once it is ours: handing it back mid-drag leaves the
      // thumb stranded wherever the finger was.
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  if (!isVisible || !accessState.visible) return null;

  const inert = disabled || accessState.disabled || accessState.readonly;

  const publish = (next: number) => {
    if (next === value) return;
    if (isFormMode) commit(registration, next);
    if (controlledValue === undefined && !isFormMode) setOwnValue(next);
    onValueChange?.(next);
  };

  const finish = (next: number) => {
    setHeld(false);
    publish(next);
    onSlidingComplete?.(next);
  };

  live.current = { width, min, max, step, inert, publish, finish };

  const onTrackLayout = (event: LayoutChangeEvent) => {
    // The travel is the rail less the thumb: the thumb has width, and a
    // value of `max` has to put its right edge at the rail's right edge
    // rather than half a thumb past it.
    const next = event.nativeEvent.layout.width - tokens.thumb.size;
    if (next !== width) setWidth(Math.max(next, 0));
  };

  const ratio = max > min ? (Math.min(Math.max(value, min), max) - min) / (max - min) : 0;
  const offset = ratio * width;

  const nudge = (by: number) => {
    if (inert) return;
    const next = Math.min(Math.max(value + by, min), max);
    publish(next);
    onSlidingComplete?.(next);
  };

  return (
    <View
      // One element with one name: the rail, the thumb and the number
      // are one control, and a reader stopping on each of them would be
      // told the same thing three times.
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert }}
      // The rail is a gesture, and a gesture is not something a reader
      // can make. These are what let it be answered at all.
      accessibilityValue={{ min, max, now: value, text: formatValue(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        nudge(event.nativeEvent.actionName === 'increment' ? step : -step)
      }
      {...rest}
      style={[{ gap: tokens.gap }, inert ? { opacity: theme.semantic.opacity.disabled } : null, sx?.root]}
    >
      {label || showValue ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {label ? (
            <Text style={[{ ...tokens.typography.label, color: tokens.color.label }, sx?.label]}>
              {label}
            </Text>
          ) : (
            <View />
          )}
          {showValue ? (
            <Text style={[{ ...tokens.typography.value, color: tokens.color.value }, sx?.value]}>
              {formatValue(value)}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        {...responder.panHandlers}
        onLayout={onTrackLayout}
        onTouchStart={() => setHeld(!inert)}
        // A four-point rail is a four-point target. The box is a touch
        // target tall and the rail is drawn in the middle of it.
        style={{ height: tokens.hitHeight, justifyContent: 'center' }}
      >
        <View
          style={[
            {
              height: tokens.track.height,
              borderRadius: tokens.track.radius,
              backgroundColor: inert ? tokens.color.trackDisabled : tokens.track.color,
            },
            sx?.track,
          ]}
        />
        <View
          style={[
            {
              position: 'absolute',
              left: 0,
              width: offset + tokens.thumb.size / 2,
              height: tokens.track.height,
              borderRadius: tokens.track.radius,
              backgroundColor: inert ? tokens.color.thumbDisabled : tokens.track.colorFilled,
            },
            sx?.filled,
          ]}
        />
        <View
          style={[
            {
              position: 'absolute',
              left: offset,
              width: tokens.thumb.size,
              height: tokens.thumb.size,
              borderRadius: tokens.thumb.radius,
              backgroundColor: inert ? tokens.color.thumbDisabled : tokens.thumb.color,
              borderWidth: tokens.thumb.borderWidth,
              borderColor: tokens.thumb.borderColor,
              transform: [{ scale: held && !inert ? tokens.thumbPressedScale : 1 }],
            },
            sx?.thumb,
          ]}
        />
      </View>

      {helperText ? (
        <Text style={[{ ...tokens.typography.helper, color: tokens.color.helper }, sx?.helper]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
