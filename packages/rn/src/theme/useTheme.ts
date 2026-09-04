import { useSnapshot } from 'valtio';
import { themeStore } from './store';
import type { Theme } from './theme.types';

/**
 * The resolved, reactive theme.
 *
 * Every value is concrete: no path strings, no lookup function to learn.
 * Reading is granular because it goes through a valtio snapshot, so a
 * component that touches `semantic.surface.raised` does not re-render
 * when the type scale changes.
 *
 * This is the sanctioned way to stay on the design system in code the
 * library did not write. Application code should read the **semantic**
 * tier; primitives are reachable but are the wrong level, exactly as
 * they are for our own components.
 *
 * @example
 * ```tsx
 * const theme = useTheme();
 *
 * <View style={{
 *   backgroundColor: theme.semantic.surface.raised,
 *   padding: theme.semantic.space.inset,
 *   borderRadius: theme.semantic.radius.surface,
 * }} />
 * ```
 */
export function useTheme(): Theme {
  const snap = useSnapshot(themeStore);
  return snap.themes[snap.mode] as Theme;
}

/** The active mode on its own, for components that only branch on it. */
export function useThemeMode(): Theme['meta']['mode'] {
  return useSnapshot(themeStore).mode;
}
