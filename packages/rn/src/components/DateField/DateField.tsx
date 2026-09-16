import { useId, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSnapshot } from 'valtio';
import {
  generateTimeOptions,
  getTodayISODate,
  useCalendar,
} from '@dashforge/calendar-core';
import type { FieldRegistration } from '@dashforge/ui-core';
import { useAccessState } from '../../hooks/useAccessState';
import { useStandaloneFieldWarning } from '../../hooks/useStandaloneFieldWarning';
import { useVisibility } from '../../hooks/useVisibility';
import { runtime } from '../../theme/Provider';
import { resolveTypeStyle } from '../../theme/typography';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { useFormField } from '../_shared/useFormField';
import { formatValue, isWithin } from './dateField.format';
import type { DateFieldProps } from './dateField.types';

/**
 * A day, or a time of day.
 *
 * **The picker is injected and never imported.** Every real one is a
 * native module, and rule 5.1 says a capability like that is declared by
 * the library and supplied by the application: give
 * `DashforgeNativeProvider` a `datePicker` and this opens the platform's
 * own, which is bucket three honoured, because a date picker is a
 * surface somebody recognises as belonging to their phone.
 *
 * **Without one it falls back to a calendar of ours**, drawn on
 * `calendar-core`, and says so once in development. That is the one
 * place this library draws a system surface, and the reason is in the
 * rule itself: an adapter has to degrade to something, and for a field
 * the only thing below "the platform's picker" that is not "unanswerable"
 * is a calendar. A field nobody can fill is worse than a calendar that
 * is not the platform's.
 *
 * **It answers with a string**, `YYYY-MM-DD` or `HH:mm`, in the payload
 * and out of it. Never a `Date`: a `Date` is a moment in time, a
 * birthday is the same day in every timezone, and putting one through
 * the other is how it becomes the day before for everybody east of the
 * meridian.
 *
 * @example
 * ```tsx
 * <DateField name="nascita" label="Data di nascita" max={getTodayISODate()} />
 * <DateField mode="time" label="Orario" value={at} onValueChange={setAt} />
 * ```
 */
export function DateField(props: DateFieldProps) {
  const themeDefaults = useComponentDefaults('DateField');
  const tokens = useComponentTokens('DateField');
  const native = useSnapshot(runtime);

  const {
    mode = 'date',
    name,
    rules,
    label,
    helperText,
    placeholder,
    required = false,
    error,
    disabled = false,
    size = 'md',
    fullWidth = false,
    radius = 'md',
    min,
    max,
    minuteStep = 15,
    locale = 'it-IT',
    weekStartDay = 1,
    value: controlledValue,
    defaultValue,
    onValueChange,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as DateFieldProps;

  const { bridge, isFormMode, fieldMeta, register, commit } = useFormField(name, rules);
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const [ownValue, setOwnValue] = useState<string | undefined>(defaultValue);
  const [open, setOpen] = useState(false);
  const labelId = useId();
  useStandaloneFieldWarning('DateField', name, isFormMode, controlledValue, onValueChange);

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
      const v = fieldMeta.value;
      value = v == null ? undefined : String(v);
    }
  }

  const inert = disabled || accessState.disabled;
  const readOnly = accessState.readonly;

  // The grid is a hook and hooks do not run conditionally, so it is
  // built whether or not the fallback is ever shown. It costs an object
  // per render and buys the rule that the component has one shape.
  const calendar = useCalendar({
    selected: value && mode === 'date' ? value : null,
    defaultFocusedDate: value && mode === 'date' ? value : getTodayISODate(),
    minDate: mode === 'date' ? min : undefined,
    maxDate: mode === 'date' ? max : undefined,
    weekStartDay,
    locale,
  });

  if (!isVisible || !accessState.visible) return null;

  const answer = (next: string | undefined) => {
    if (next !== undefined && !isWithin(next, min, max)) return;
    if (isFormMode) {
      commit(registration, next);
      void registration?.onBlur?.({ target: { name, value: next } });
    }
    if (controlledValue === undefined && !isFormMode) setOwnValue(next);
    onValueChange?.(next);
    setOpen(false);
  };

  const ask = async () => {
    if (inert || readOnly) return;

    const picker = native.datePicker;
    if (!picker) {
      if (__DEV__) {
        console.warn(
          '[@dashforge/rn] <DateField> opened with no `datePicker` on <DashforgeNativeProvider>, ' +
            'so it is showing the calendar this library draws rather than the platform’s own. ' +
            'Supply one and the field delegates instead.',
        );
      }
      setOpen(true);
      return;
    }

    const chosen = await picker.open({ mode, value, min, max, label, locale });
    // `null` is a dismissal and not an answer, so nothing is written:
    // somebody who changed their mind has not cleared the field.
    if (chosen !== null) answer(chosen);
  };

  const shown = formatValue(value, mode, locale);
  const state = inert ? 'disabled' : open ? 'open' : 'rest';
  const borderColor = inert
    ? tokens.color.borderDisabled
    : invalid
      ? tokens.color.borderInvalid
      : state === 'open'
        ? tokens.color.borderOpen
        : tokens.color.border;

  const times =
    mode === 'time'
      ? generateTimeOptions({
          stepMinutes: minuteStep,
          // The default stops at half past eleven, which loses the last
          // half hour of the day for anything finer than thirty minutes.
          end: '23:59',
        }).filter((t) => isWithin(t, min, max))
      : [];

  return (
    <View
      {...rest}
      style={[
        { gap: tokens.gap, alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        sx?.root,
      ]}
    >
      {label ? (
        <Text
          nativeID={labelId}
          style={[
            {
              ...resolveTypeStyle(tokens.typography.label),
              color: inert ? tokens.color.labelDisabled : tokens.color.label,
            },
            sx?.label,
          ]}
        >
          {label}
          {required ? (
            <Text style={{ color: tokens.color.required }} accessibilityElementsHidden>
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabelledBy={label ? labelId : undefined}
        accessibilityLabel={label ? undefined : placeholder}
        accessibilityValue={{ text: shown ?? undefined }}
        accessibilityState={{ disabled: inert, expanded: open }}
        // Announced rather than only coloured: a red border says nothing
        // to a reader, and nothing at all to one who cannot separate red
        // from grey.
        accessibilityHint={invalid ? helper : undefined}
        disabled={inert || readOnly}
        onPress={ask}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minHeight: tokens.minHeight[size],
            paddingHorizontal: tokens.paddingHorizontal[size],
            borderRadius: tokens.radius[radius],
            borderWidth: state === 'open' ? tokens.borderWidthFocused : tokens.borderWidth,
            borderColor,
            backgroundColor: inert ? tokens.color.bgDisabled : tokens.color.bg,
          },
          sx?.trigger,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            {
              ...resolveTypeStyle(tokens.typography.value),
              color: inert
                ? tokens.color.valueDisabled
                : shown
                  ? tokens.color.value
                  : tokens.color.placeholder,
            },
            sx?.value,
          ]}
        >
          {shown ?? placeholder ?? ''}
        </Text>

        {/*
          A little calendar: a box with a line under its top edge and two
          posts above it. Drawn from views, like every other mark here.
        */}
        <View
          style={{
            width: tokens.glyph.size,
            height: tokens.glyph.size,
            borderWidth: tokens.glyph.thickness,
            borderColor: tokens.color.glyph,
            borderRadius: 2,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: tokens.glyph.size * 0.28,
              height: tokens.glyph.thickness,
              backgroundColor: tokens.color.glyph,
            }}
          />
        </View>
      </Pressable>

      {helper ? (
        <Text
          style={[
            {
              ...resolveTypeStyle(tokens.typography.helper),
              color: invalid ? tokens.color.helperInvalid : tokens.color.helper,
            },
            sx?.helper,
          ]}
        >
          {helper}
        </Text>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} label={label}>
        <Modal.Header title={label ?? (mode === 'time' ? 'Orario' : 'Data')} />

        {mode === 'time' ? (
          <ScrollView style={{ maxHeight: tokens.panelMaxHeight }}>
            {times.map((time) => {
              const chosen = time === value;
              return (
                <Pressable
                  key={time}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: chosen }}
                  onPress={() => answer(time)}
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderRadius: tokens.cell.radius,
                    backgroundColor: chosen ? tokens.color.daySelectedBg : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      ...resolveTypeStyle(tokens.typography.day),
                      color: chosen ? tokens.color.daySelectedFg : tokens.color.day,
                    }}
                  >
                    {formatValue(time, 'time', locale) ?? time}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={sx?.panel}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                onPress={calendar.goToPreviousMonth}
                accessibilityLabel="Mese precedente"
              >
                {'‹'}
              </Button>
              <Text
                accessibilityRole="header"
                style={{
                  ...resolveTypeStyle(tokens.typography.monthLabel),
                  color: tokens.color.value,
                }}
              >
                {calendar.monthLabel}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                onPress={calendar.goToNextMonth}
                accessibilityLabel="Mese successivo"
              >
                {'›'}
              </Button>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {calendar.weekdayNames.map((day) => (
                <Text
                  key={day}
                  // The column headers are one letter of context each and
                  // a reader hearing seven of them before every grid is a
                  // reader who stops using the field.
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    ...resolveTypeStyle(tokens.typography.weekday),
                    color: tokens.color.weekday,
                  }}
                >
                  {day}
                </Text>
              ))}
            </View>

            {calendar.weeks.map((week) => (
              <View key={week.key} style={{ flexDirection: 'row' }}>
                {week.days.map((day) => (
                  <Pressable
                    key={day.iso}
                    accessibilityRole="button"
                    accessibilityLabel={formatValue(day.iso, 'date', locale) ?? day.iso}
                    accessibilityState={{ selected: day.isSelected, disabled: day.isDisabled }}
                    disabled={day.isDisabled}
                    onPress={() => answer(day.iso)}
                    style={{
                      flex: 1,
                      height: tokens.cell.size,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: tokens.cell.radius,
                      backgroundColor: day.isSelected
                        ? tokens.color.daySelectedBg
                        : 'transparent',
                      // Today is an outline and not a fill, or the day
                      // somebody is on and the day they chose would look
                      // like the same thing.
                      borderWidth: day.isToday && !day.isSelected ? tokens.borderWidth : 0,
                      borderColor: tokens.color.todayBorder,
                    }}
                  >
                    <Text
                      style={{
                        ...resolveTypeStyle(tokens.typography.day),
                        color: day.isDisabled
                          ? tokens.color.dayDisabled
                          : day.isSelected
                            ? tokens.color.daySelectedFg
                            : day.isSiblingMonth
                              ? tokens.color.dayMuted
                              : tokens.color.day,
                      }}
                    >
                      {day.day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        )}

        <Modal.Footer align="between">
          <Button variant="ghost" color="secondary" onPress={() => answer(undefined)}>
            Cancella
          </Button>
          <Button variant="outline" color="secondary" onPress={() => setOpen(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </View>
  );
}
