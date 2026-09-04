import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Appearance } from 'react-native';
import { proxy, useSnapshot } from 'valtio';
import type { ThemeMode } from '../tokens/types';
import {
  readStoredMode,
  setMode,
  setTheme,
  themeStore,
  writeStoredMode,
} from './store';
import type { HapticsAdapter, ModeStorage, Theme } from './theme.types';

/**
 * Runtime capabilities the host app supplies. Everything here needs
 * native code, so none of it is a dependency: the library declares the
 * interface and degrades to a working no-op when nothing is provided.
 *
 * @internal
 */
export const runtime = proxy<{
  haptics: HapticsAdapter | null;
  reduceMotion: boolean;
}>({
  haptics: null,
  reduceMotion: false,
});

export interface DashforgeNativeProviderProps {
  children: ReactNode;
  /**
   * Replace one or both shipped themes on mount.
   */
  theme?: Theme | { light: Theme; dark: Theme };
  /**
   * Force the initial mode. Without it the provider follows the system
   * appearance, or the persisted value when `storage` is supplied.
   * @default undefined
   */
  initialMode?: ThemeMode;
  /**
   * Controlled mode. When set, this value is authoritative and the
   * provider syncs the store to it on every render.
   * @default undefined
   */
  mode?: ThemeMode;
  /** Called whenever the active mode changes, from any source. */
  onModeChange?: (mode: ThemeMode) => void;
  /**
   * Follow the operating system's light/dark setting.
   * @default true
   */
  followSystem?: boolean;
  /**
   * Persistence for the active mode. Optional: without it the mode does
   * not survive a relaunch, which is a valid configuration.
   * @default undefined
   */
  storage?: ModeStorage;
  /**
   * Haptic feedback. Optional: without it presses are silent and every
   * component still behaves correctly.
   * @default undefined
   */
  haptics?: HapticsAdapter;
}

/**
 * Wires the theme store to the platform. Renders no view of its own.
 *
 * Responsibilities, in order of precedence on mount: `mode` prop, then
 * `initialMode`, then the persisted value, then the system appearance.
 */
export function DashforgeNativeProvider({
  children,
  theme,
  initialMode,
  mode,
  onModeChange,
  followSystem = true,
  storage,
  haptics,
}: DashforgeNativeProviderProps) {
  // One-shot seeding, guarded against StrictMode's double invoke.
  const seeded = useRef(false);
  if (!seeded.current) {
    seeded.current = true;
    if (theme) {
      if ('light' in theme && 'dark' in theme) {
        setTheme(theme.light);
        setTheme(theme.dark);
      } else {
        setTheme(theme);
      }
    }
    const seed =
      mode ?? initialMode ?? (followSystem ? Appearance.getColorScheme() : null);
    if (seed === 'light' || seed === 'dark') setMode(seed);
  }

  runtime.haptics = haptics ?? null;

  // Persisted mode wins over the system default, but never over an
  // explicit prop: the caller has already decided in that case.
  useEffect(() => {
    if (!storage || mode || initialMode) return;
    let cancelled = false;
    void readStoredMode(storage).then((stored) => {
      if (!cancelled && stored) setMode(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [storage, mode, initialMode]);

  useEffect(() => {
    if (!followSystem || mode) return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'light' || colorScheme === 'dark') setMode(colorScheme);
    });
    return () => sub.remove();
  }, [followSystem, mode]);

  // Reduce-motion is read once and then watched. Every animated component
  // collapses its duration to `motion.instant` when this is on: for a
  // reader with a vestibular disorder it is not a preference.
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) runtime.reduceMotion = enabled;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      runtime.reduceMotion = enabled;
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const active = useSnapshot(themeStore).mode;

  // Controlled loop: the prop is authoritative when present.
  useEffect(() => {
    if (mode && mode !== active) setMode(mode);
  }, [mode, active]);

  useEffect(() => {
    if (storage) void writeStoredMode(storage, active);
    onModeChange?.(active);
    // `onModeChange` is intentionally excluded: an inline arrow would
    // otherwise fire this on every render of the host.
  }, [active, storage]);

  return <>{children}</>;
}
