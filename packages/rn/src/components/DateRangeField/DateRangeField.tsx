import { useId, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useDateRange } from '@dashforge/calendar-core';
import type { FieldRegistration } from '@dashforge/ui-core';
import { useAccessState } from '../../hooks/useAccessState';
import { useStandaloneFieldWarning } from '../../hooks/useStandaloneFieldWarning';
import { useVisibility } from '../../hooks/useVisibility';
import { resolveTypeStyle } from '../../theme/typography';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { resolveValidationState } from '../_shared/resolveValidationState';
import { useFormField } from '../_shared/useFormField';
import { formatRange, formatShortDay } from './dateRangeField.format';
import type { DateRangeFieldProps, DateRangeValue } from './dateRangeField.types';

const EMPTY: DateRangeValue = { start: null, end: null };

/**
 * From one day to another.
 *
 * **The one place a calendar of ours is the first answer and not the
 * fallback.** ARCHITECTURE.md says a custom grid is justified only where
 * the platform has nothing good, which in practice means ranges: iOS and
 * Android both ship a picker for one date and neither ships one for two,
 * so there is nothing to delegate to and `calendar-core` is the engine.
 * That is why this takes no `datePicker` and `DateField` does.
 *
 * It reports the half-picked range as well as the finished one. Showing
 * "from the 14th" while somebody hunts for the other end is what tells
 * them the field heard the first press; a caller that only wants the
 * complete answer checks `end`.
 *
 * In a form it writes **one field holding both ends**, because a range
 * is one answer with two ends and not two answers.
 *
 * It reuses `DateField`'s tokens: the two are the same control and the
 * same grid, and a theme that restyled one and not the other would be a
 * bug nobody could see coming.
 *
 * @example
 * ```tsx
 * <DateRangeField name="soggiorno" label="Soggiorno" min={getTodayISODate()} />
 * ```
 */
export function DateRangeField(props: DateRangeFieldProps) {
  const themeDefaults = useComponentDefaults('DateField');
  const tokens = useComponentTokens('DateField');

  const {
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
    monthCount = 1,
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
  } = { ...themeDefaults, ...props } as DateRangeFieldProps;

  const { bridge, isFormMode, fieldMeta, register, commit } = useFormField(name, rules);
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const [ownValue, setOwnValue] = useState<DateRangeValue>(defaultValue ?? EMPTY);
  const [open, setOpen] = useState(false);
  const labelId = useId();
  useStandaloneFieldWarning('DateRangeField', name, isFormMode, controlledValue, onValueChange);

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
      const v = fieldMeta.value as DateRangeValue | undefined;
      value = v ?? EMPTY;
    }
  }

  const answer = (next: DateRangeValue) => {
    if (isFormMode) {
      commit(registration, next);
      // Blurred only once the answer is whole: telling the engine a
      // half-picked range was touched would show "required" between the
      // two presses, which is a scolding for something in progress.
      if (next.start && next.end) {
        void registration?.onBlur?.({ target: { name, value: next } });
      }
    }
    if (controlledValue === undefined && !isFormMode) setOwnValue(next);
    onValueChange?.(next);
    // Closed on the second press, so the field does not need dismissing
    // once it has been answered.
    if (next.start && next.end) setOpen(false);
  };

  const calendar = useDateRange({
    value,
    onChange: answer,
    monthCount,
    minDate: min,
    maxDate: max,
    weekStartDay,
    locale,
  });

  if (!isVisible || !accessState.visible) return null;

  const inert = disabled || accessState.disabled;
  const readOnly = accessState.readonly;
  const shown = formatRange(value, locale);
  const borderColor = inert
    ? tokens.color.borderDisabled
    : invalid
      ? tokens.color.borderInvalid
      : open
        ? tokens.color.borderOpen
        : tokens.color.border;

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
        accessibilityHint={invalid ? helper : undefined}
        disabled={inert || readOnly}
        onPress={() => setOpen(true)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minHeight: tokens.minHeight[size],
            paddingHorizontal: tokens.paddingHorizontal[size],
            borderRadius: tokens.radius[radius],
            borderWidth: open ? tokens.borderWidthFocused : tokens.borderWidth,
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
        <Modal.Header
          title={label ?? 'Periodo'}
          // Says which press is next, which is the one thing a range
          // picker has to say and most of them do not.
          subtitle={
            value.start && !value.end
              ? `Da ${formatShortDay(value.start, locale)}. Scegli la fine.`
              : 'Scegli il primo giorno.'
          }
        />

        <ScrollView style={{ maxHeight: tokens.panelMaxHeight }}>
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

            {calendar.months.map((shownMonth) => (
              <View key={`${shownMonth.year}-${shownMonth.month}`} style={{ gap: 2 }}>
                {monthCount > 1 ? (
                  <Text
                    accessibilityRole="header"
                    style={{
                      ...resolveTypeStyle(tokens.typography.weekday),
                      color: tokens.color.weekday,
                      textAlign: 'center',
                    }}
                  >
                    {shownMonth.monthLabel}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row' }}>
                  {calendar.weekdayNames.map((day) => (
                    <Text
                      key={day}
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

                {shownMonth.weeks.map((week) => (
                  <View key={week.key} style={{ flexDirection: 'row' }}>
                    {week.days.map((day) => {
                      const edge = day.isRangeStart || day.isRangeEnd;
                      return (
                        <Pressable
                          key={day.iso}
                          accessibilityRole="button"
                          accessibilityLabel={formatShortDay(day.iso, locale) ?? day.iso}
                          accessibilityState={{
                            selected: edge || day.isInRange,
                            disabled: day.isDisabled,
                          }}
                          disabled={day.isDisabled}
                          onPress={() => calendar.selectDate(day.iso)}
                          style={{
                            flex: 1,
                            height: tokens.cell.size,
                            alignItems: 'center',
                            justifyContent: 'center',
                            // The band is square and the two ends are
                            // round, which is what makes a run of days
                            // read as one thing with two ends rather
                            // than as a row of circles.
                            borderRadius: edge ? tokens.cell.radius : 0,
                            backgroundColor: edge
                              ? tokens.color.daySelectedBg
                              : day.isInRange
                                ? tokens.color.bgDisabled
                                : 'transparent',
                            borderWidth:
                              day.isToday && !edge && !day.isInRange ? tokens.borderWidth : 0,
                            borderColor: tokens.color.todayBorder,
                          }}
                        >
                          <Text
                            style={{
                              ...resolveTypeStyle(tokens.typography.day),
                              color: day.isDisabled
                                ? tokens.color.dayDisabled
                                : edge
                                  ? tokens.color.daySelectedFg
                                  : day.isSiblingMonth
                                    ? tokens.color.dayMuted
                                    : tokens.color.day,
                            }}
                          >
                            {day.day}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal.Footer align="between">
          <Button variant="ghost" color="secondary" onPress={() => answer(EMPTY)}>
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
