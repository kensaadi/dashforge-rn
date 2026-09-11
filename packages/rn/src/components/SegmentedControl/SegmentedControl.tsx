import { useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { FieldRegistration } from '@dashforge/ui-core';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useStandaloneFieldWarning } from '../../hooks/useStandaloneFieldWarning';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { useFormField } from '../_shared/useFormField';
import { segmentedControlRecipe } from './segmentedControl.variants';
import type { SegmentValue, SegmentedControlProps } from './segmentedControl.types';

/**
 * One answer among two or three, in the width of one control.
 *
 * **It is `RadioGroup`'s shape, not `Tabs`'s**, and the difference is
 * which side of a boundary the choice falls on. A tab picks a view of
 * something and the form engine has no business knowing which one is
 * open. This picks an *answer*: private or business, monthly or yearly.
 * So it takes a `name`, it registers with the engine, and what it holds
 * ends up in the payload. Anything that switches what a screen shows is
 * `Tabs`, whatever it looks like.
 *
 * Two to four segments. Past that the words stop fitting in a shared
 * width and the answer belongs in a `Select` or a `RadioGroup`, which
 * is why the label on a segment is a string and not a node: a component
 * that accepted anything would be inviting exactly the content that
 * breaks it.
 *
 * **It does not seed itself**, like `RadioGroup` and unlike `Checkbox`.
 * No segment chosen is the absence of an answer, and a control that
 * wrote its first option into the payload on mount would turn a question
 * nobody answered into one they did.
 *
 * The thumb slides rather than appears, and its place is arithmetic
 * rather than measurement: the segments share the width equally, so the
 * thumb is one share wide and sits at index times a share. Only the
 * track has to be measured, once.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   name="fatturazione"
 *   label="Fatturazione"
 *   options={[
 *     { value: 'monthly', label: 'Mensile' },
 *     { value: 'yearly', label: 'Annuale' },
 *   ]}
 * />
 * ```
 */
export function SegmentedControl(props: SegmentedControlProps) {
  const themeDefaults = useComponentDefaults('SegmentedControl');
  const tokens = useComponentTokens('SegmentedControl');

  const {
    options,
    name,
    rules,
    label,
    helperText,
    required = false,
    error,
    disabled = false,
    size = 'md',
    value: controlledValue,
    defaultValue,
    onValueChange,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as SegmentedControlProps;

  const { bridge, isFormMode, fieldMeta, register, commit } = useFormField(name, rules);
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const reduceMotion = useReduceMotion();
  const labelId = useId();
  const [ownValue, setOwnValue] = useState<SegmentValue | undefined>(defaultValue);
  const [trackWidth, setTrackWidth] = useState(0);
  useStandaloneFieldWarning(
    'SegmentedControl',
    name,
    isFormMode,
    controlledValue,
    onValueChange,
  );

  const slide = useRef(new Animated.Value(0)).current;
  /** Nothing to slide from before the first measurement: it starts there. */
  const placed = useRef(false);

  let registration: FieldRegistration | null = null;
  let invalid = error ?? false;
  let helper = helperText;
  let value = controlledValue ?? ownValue;

  if (isFormMode && bridge && name) {
    registration = register();
    const validation = resolveValidationState(name, bridge, error, helperText);
    invalid = validation.invalid;
    helper = validation.helperText;
    if (controlledValue === undefined) {
      // The reactive snapshot, and no coercion: the value goes in and
      // comes out as it was given, string or number.
      value = fieldMeta.value as SegmentValue | undefined;
    }
  }

  const index = options.findIndex((option) => option.value === value);
  const share = options.length > 0 ? (trackWidth - tokens.inset * 2) / options.length : 0;

  useEffect(() => {
    if (share <= 0) return;
    // Nothing chosen means nothing to point at: the thumb stays where it
    // is and the track shows through, which is what an unanswered
    // question should look like.
    if (index < 0) return;

    const to = tokens.inset + index * share;
    if (!placed.current || reduceMotion) {
      placed.current = true;
      slide.setValue(to);
      return;
    }
    Animated.timing(slide, {
      toValue: to,
      duration: tokens.duration,
      easing: Easing.out(Easing.cubic),
      // `translateX` alone would go on the native driver, but the thumb's
      // width is set from the same measurement and a view cannot have
      // half its animation on each driver.
      useNativeDriver: false,
    }).start();
  }, [index, share, reduceMotion, slide, tokens.inset, tokens.duration]);

  if (!isVisible || !accessState.visible) return null;

  const inert = disabled || accessState.disabled || accessState.readonly;
  const resolve = segmentedControlRecipe(tokens);
  const styles = resolve({ size, invalid, disabled: inert });

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width !== trackWidth) setTrackWidth(width);
  };

  const select = (next: SegmentValue) => {
    if (next === value) return;
    commit(registration, next);
    if (isFormMode) void registration?.onBlur?.({ target: { name, value: next } });
    if (controlledValue === undefined && !isFormMode) setOwnValue(next);
    onValueChange?.(next);
  };

  return (
    <View
      // Announced as one thing with a name, so the question is read once
      // before the answers rather than leaving three words with nothing
      // to belong to.
      accessibilityRole="radiogroup"
      accessibilityLabelledBy={label ? labelId : undefined}
      {...rest}
      style={[styles.root, sx?.root]}
    >
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

      <View onLayout={onTrackLayout} style={[styles.track, sx?.track]}>
        {index >= 0 && share > 0 ? (
          <Animated.View
            // Decoration: the selected segment already says it is
            // selected, and a reader stopping on a sliding block would
            // be told nothing.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.thumb,
              { width: share, transform: [{ translateX: slide }] },
              sx?.thumb,
            ]}
          />
        ) : null}

        {options.map((option) => {
          const chosen = option.value === value;
          const off = inert || option.disabled;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: chosen, disabled: off }}
              disabled={off}
              onPress={() => select(option.value)}
              style={[styles.segment, sx?.segment]}
            >
              <Text
                numberOfLines={1}
                style={[
                  resolve({
                    size,
                    state: off ? 'disabled' : chosen ? 'selected' : 'rest',
                  }).segmentLabel,
                  sx?.segmentLabel,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {helper ? <Text style={[styles.helper, sx?.helper]}>{helper}</Text> : null}
    </View>
  );
}
