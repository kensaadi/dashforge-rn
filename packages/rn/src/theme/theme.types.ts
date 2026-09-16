import type { ComponentTokens, SemanticTokens, ThemeMode } from '../tokens/types';
import type { Palette } from '../tokens/palette';

/** Re-exported so a theme author needs one import, not two. */
export type { Palette };

/** A fully resolved theme: all three tiers, concrete values, no functions left. */
export interface Theme {
  meta: {
    /** Human-readable name, shown in dev tooling. */
    name: string;
    mode: ThemeMode;
  };
  palette: Palette;
  semantic: SemanticTokens;
  components: ComponentTokens;
}

/**
 * Theme input. Each tier may be a plain value or a function of the tiers
 * below it, which is what lets tier 3 point at tier 2 with real values
 * and full type checking rather than stringly-typed paths.
 */
export interface ThemeInput {
  meta: Theme['meta'];
  palette?: Palette;
  semantic: SemanticTokens | ((tiers: { palette: Palette }) => SemanticTokens);
  components?:
    | ComponentTokens
    | ((tiers: { palette: Palette; semantic: SemanticTokens }) => ComponentTokens);
}

/** Recursive partial, for `patchTheme`. Arrays are replaced wholesale. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

/**
 * Persistence for the active mode. Injected, never imported: AsyncStorage
 * and MMKV are both native modules, and requiring one would break rule 3.
 * With no adapter the mode simply does not survive a relaunch, which is a
 * valid configuration.
 */
export interface ModeStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}

/**
 * Haptic feedback, spoken in intentions rather than durations so every
 * component uses the same words. Optional and injected: both real
 * implementations are native modules.
 */
export type HapticIntent =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'success'
  | 'warning'
  | 'error';

export interface HapticsAdapter {
  trigger(intent: HapticIntent): void;
}

/**
 * What a date field asks the platform picker for.
 *
 * **Strings and never a `Date`.** A `Date` is a moment in time and most
 * of what a form asks for is not: a birthday is the same day in every
 * timezone, and putting one through a `Date` is how it becomes the day
 * before for anybody east of the meridian. `calendar-core` speaks ISO
 * throughout, the payload carries ISO, and so does this.
 */
export interface DatePickerRequest {
  /** What is being asked for. */
  mode: 'date' | 'time';
  /** The current answer: `YYYY-MM-DD` for a date, `HH:mm` for a time. */
  value?: string;
  /** The earliest and latest answers, in the same shape. */
  min?: string;
  max?: string;
  /** What the field is called, for a picker that shows a title. */
  label?: string;
  /** BCP-47, for a picker that reads it. */
  locale?: string;
}

/**
 * The platform's date and time picker, supplied by the application.
 *
 * Every real one is a native module, so the library declares the shape
 * and the app plugs in what it already has. Without one, date fields
 * fall back to the calendar `calendar-core` powers: not the platform's
 * own, and said out loud in development, because a field nobody can
 * answer would be worse than one answered by a calendar of ours.
 */
export interface DatePickerAdapter {
  /**
   * Opens it, and resolves with the chosen value or `null` when it was
   * dismissed. Cancelling is an answer, not an error, as everywhere
   * else here.
   */
  open(request: DatePickerRequest): Promise<string | null>;
}
