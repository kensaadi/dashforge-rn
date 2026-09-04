import { proxy, snapshot } from 'valtio';
import { semanticDark, semanticLight } from '../tokens/semantic';
import type { ThemeMode } from '../tokens/types';
import { defineTheme } from './defineTheme';
import type { DeepPartial, ModeStorage, Theme } from './theme.types';

/** Key used when a `ModeStorage` adapter is supplied. */
export const MODE_STORAGE_KEY = 'dashforge:rn:mode';

const defaultLight = defineTheme({
  meta: { name: 'Dashforge Light', mode: 'light' },
  semantic: semanticLight,
});

const defaultDark = defineTheme({
  meta: { name: 'Dashforge Dark', mode: 'dark' },
  semantic: semanticDark,
});

/**
 * The theme store.
 *
 * Holds **both** themes and the active mode, rather than one active
 * theme, so `setMode` is a pointer move instead of a rebuild. That is
 * also what makes dark mode a tier-2 swap: the primitives and the
 * component tokens on either side are the same objects.
 *
 * @internal Consumers read through `useTheme()` and write through the
 * exported actions.
 */
export const themeStore = proxy<{
  themes: Record<ThemeMode, Theme>;
  mode: ThemeMode;
}>({
  themes: { light: defaultLight, dark: defaultDark },
  mode: 'light',
});

/** Non-reactive read of the active theme. Prefer `useTheme()` in components. */
export function getTheme(): Theme {
  return snapshot(themeStore).themes[themeStore.mode] as Theme;
}

/** Switch the active mode. */
export function setMode(mode: ThemeMode): void {
  if (themeStore.mode !== mode) themeStore.mode = mode;
}

/** Flip between light and dark. */
export function toggleMode(): void {
  setMode(themeStore.mode === 'light' ? 'dark' : 'light');
}

/**
 * Replace one of the two themes wholesale. The mode is taken from the
 * theme's own `meta.mode`, so the two cannot drift apart.
 */
export function setTheme(theme: Theme): void {
  themeStore.themes[theme.meta.mode] = theme;
}

/**
 * Deep-merge a partial theme.
 *
 * `target` defaults to `'both'` because most patches are structural
 * (a radius, a spacing step, a component default) and belong in both
 * modes. Pass `'light'`, `'dark'` or `'active'` for anything that is
 * genuinely mode-specific, which in practice means colours.
 *
 * Arrays are replaced wholesale, never merged element by element.
 */
export function patchTheme(
  partial: DeepPartial<Theme>,
  target: ThemeMode | 'active' | 'both' = 'both',
): void {
  const modes: ThemeMode[] =
    target === 'both'
      ? ['light', 'dark']
      : [target === 'active' ? themeStore.mode : target];
  for (const mode of modes) {
    deepMergeInto(
      themeStore.themes[mode] as unknown as Record<string, unknown>,
      partial,
    );
  }
}

/** @internal In-place recursive merge of plain-object trees. */
function deepMergeInto(target: Record<string, unknown>, source: unknown): void {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) return;
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const next = (source as Record<string, unknown>)[key];
    const current = target[key];
    if (
      next !== null &&
      typeof next === 'object' &&
      !Array.isArray(next) &&
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      deepMergeInto(current as Record<string, unknown>, next);
    } else if (next !== undefined) {
      target[key] = next;
    }
  }
}

/** @internal Read a persisted mode, tolerating every way storage can fail. */
export async function readStoredMode(storage: ModeStorage): Promise<ThemeMode | null> {
  try {
    const raw = await storage.getItem(MODE_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

/** @internal Best-effort write. A full disk is not worth crashing an app over. */
export async function writeStoredMode(
  storage: ModeStorage,
  mode: ThemeMode,
): Promise<void> {
  try {
    await storage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* ignored on purpose */
  }
}
