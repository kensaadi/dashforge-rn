import type { DateParts } from '@dashforge/calendar-core';
import { formatLongDate, isValidISODate, parseISODate } from '@dashforge/calendar-core';
import type { DateRangeValue } from './dateRangeField.types';

/** Reads a day, or nothing where the string is not one. */
function readParts(value: string | null): DateParts | null {
  if (!value || !isValidISODate(value)) return null;
  return parseISODate(value);
}

/** Writes a day with whichever of day/month/year the caller asked for. */
function write(parts: DateParts, locale: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(
      new Date(Date.UTC(parts.year, parts.month - 1, parts.day)),
    );
  } catch {
    return formatLongDate(parts, locale);
  }
}

/**
 * One day, short: `14 mar 2026`.
 *
 * The long form two ends over is a trigger nobody can read on a phone,
 * so the range writes its ends short while a single date writes itself
 * long. Falls back to the long form where `Intl` has nothing to say,
 * and to nothing at all where the value is not a date.
 *
 * @internal
 */
export function formatShortDay(value: string | null, locale: string): string | null {
  const parts = readParts(value);
  if (!parts) return null;
  return write(parts, locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * What the trigger says for a range.
 *
 * Three states and not two, which is the point: nothing chosen, one end
 * chosen, both chosen. Showing only the first end while somebody hunts
 * for the second is what tells them the field heard the first press.
 *
 * The first end drops whatever the second one already says: inside a
 * month it is `18 – 23 set 2026`, inside a year `18 set – 3 ott 2026`,
 * and only across years does it write both in full. Repeating the year
 * twice on a phone spends the trigger's width on a word that carries
 * nothing.
 *
 * @internal
 */
export function formatRange(
  value: DateRangeValue | undefined,
  locale: string,
): string | null {
  const startParts = readParts(value?.start ?? null);
  if (!startParts) return null;

  const endParts = readParts(value?.end ?? null);
  // An en dash and not a hyphen: it is the dash that means "to".
  if (!endParts) return `${write(startParts, locale, { day: 'numeric', month: 'short', year: 'numeric' })} –`;

  const sameYear = startParts.year === endParts.year;
  const sameMonth = sameYear && startParts.month === endParts.month;

  const start = write(startParts, locale, {
    day: 'numeric',
    ...(sameMonth ? null : { month: 'short' as const }),
    ...(sameYear ? null : { year: 'numeric' as const }),
  });
  const end = write(endParts, locale, { day: 'numeric', month: 'short', year: 'numeric' });

  return `${start} – ${end}`;
}

/** Whether both ends are chosen, which is the only complete answer. */
export function isComplete(value: DateRangeValue | undefined): boolean {
  return Boolean(value?.start && value?.end);
}
