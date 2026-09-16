/**
 * A stand-in for the native picker, so the playground can show both
 * halves of rule 5.1 without the library growing a dependency.
 *
 * A real application puts `@react-native-community/datetimepicker`
 * behind this same interface and hands it to `DashforgeNativeProvider`.
 * The point of the switch in the Date section is that the field does not
 * know the difference: with an adapter it delegates, without one it
 * falls back.
 */
import type { DatePickerAdapter } from '@dashforge/rn/theme';

/**
 * Written out here rather than pulled from `calendar-core`: that package
 * is the library's dependency and not this app's, and an example that
 * reached past the library's public surface would be showing a consumer
 * something a consumer cannot do.
 */
const isoDaysFromToday = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

let installed = false;
const listeners = new Set<(picker: DatePickerAdapter | null) => void>();

/** Answers at once, so it is obvious that nothing was drawn. */
const fake: DatePickerAdapter = {
  open: async ({ mode }) =>
    mode === 'time' ? '11:45' : isoDaysFromToday(2),
};

export function setFakePicker(on: boolean) {
  installed = on;
  for (const listener of listeners) listener(on ? fake : null);
}

export function subscribeToPicker(listener: (picker: DatePickerAdapter | null) => void) {
  listeners.add(listener);
  listener(installed ? fake : null);
  return () => {
    listeners.delete(listener);
  };
}
