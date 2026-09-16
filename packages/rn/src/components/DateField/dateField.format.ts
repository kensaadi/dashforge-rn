import {
  formatLongDate,
  formatTime,
  isValidISODate,
  parseISODate,
  parseTimeString,
} from '@dashforge/calendar-core';

/**
 * How a chosen day or time is written on the trigger.
 *
 * Pure, and pulled out because it is the part a test can hold: what
 * appears on screen for a given answer, in a given language, and what
 * appears for an answer that is not one.
 *
 * Nothing here throws. A field handed rubbish by an API shows the
 * placeholder rather than the rubbish, which is the honest outcome:
 * the value is not a date, and pretending otherwise puts a broken
 * string in front of somebody who cannot fix it.
 *
 * @internal
 */
export function formatValue(
  value: string | undefined,
  mode: 'date' | 'time',
  locale: string,
): string | null {
  if (!value) return null;

  if (mode === 'time') {
    const parsed = parseTimeString(value);
    if (!parsed) return null;
    // `formatTime` takes the clock and not the language: twelve hours
    // where the locale says so, twenty-four everywhere else, decided
    // here because only this side knows the locale.
    return formatTime(parsed, { hour12: usesTwelveHourClock(locale) });
  }

  if (!isValidISODate(value)) return null;
  const parts = parseISODate(value);
  if (!parts) return null;
  return formatLongDate(parts, locale);
}

/**
 * Whether a language writes the time on a twelve-hour clock.
 *
 * Asked of `Intl` rather than listed, because a list of locales is a
 * list that goes stale. Hermes ships `Intl`, and where it answers with
 * nothing the fallback is the twenty-four-hour clock, which is what most
 * of the world reads.
 *
 * @internal
 */
export function usesTwelveHourClock(locale: string): boolean {
  try {
    const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
    return resolved.hour12 ?? false;
  } catch {
    return false;
  }
}

/**
 * Whether an answer is inside the fence it was given.
 *
 * Both ends are inclusive, and a missing end is not a fence. Works for
 * both shapes because ISO dates and `HH:mm` times both sort correctly
 * as strings, which is the whole reason the payload carries strings.
 *
 * @internal
 */
export function isWithin(
  value: string,
  min: string | undefined,
  max: string | undefined,
): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}
