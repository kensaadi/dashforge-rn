import { palette } from '../../tokens/palette';
import { semanticLight } from '../../tokens/semantic';
import { defineTheme } from '../defineTheme';
import {
  getTheme,
  patchTheme,
  readStoredMode,
  setMode,
  setTheme,
  themeStore,
  toggleMode,
  writeStoredMode,
} from '../store';

beforeEach(() => {
  setMode('light');
  patchTheme({ semantic: { radius: { control: 8, surface: 12, pill: 9999 } } });
});

describe('defineTheme', () => {
  it('passes each tier the ones below it', () => {
    const t = defineTheme({
      meta: { name: 'test', mode: 'light' },
      semantic: ({ palette: p }) => ({
        ...semanticLight,
        border: { ...semanticLight.border, focus: p.info['500'] },
      }),
      components: ({ semantic }) =>
        ({
          Button: { tokens: { radius: { ...semantic.radius, md: semantic.radius.pill } } },
        }) as never,
    });
    expect(t.semantic.border.focus).toBe(palette.info['500']);
    expect(t.components.Button?.tokens?.radius.md).toBe(9999);
  });

  it('accepts plain values as well as functions', () => {
    const t = defineTheme({
      meta: { name: 'test', mode: 'dark' },
      semantic: semanticLight,
    });
    expect(t.semantic).toEqual(semanticLight);
    // A copy, not the argument: two themes must never share tier-2
    // objects, or a mode-targeted patch leaks into the other mode.
    expect(t.semantic).not.toBe(semanticLight);
    // Not empty: every theme is merged over the shipped component
    // defaults, so a consumer overriding one value never has to restate
    // the rest.
    expect(t.components.Button?.tokens?.radius.md).toBe(8);
  });
});

describe('mode', () => {
  it('swaps the active theme', () => {
    expect(getTheme().meta.mode).toBe('light');
    setMode('dark');
    expect(getTheme().meta.mode).toBe('dark');
  });

  it('toggles', () => {
    toggleMode();
    expect(themeStore.mode).toBe('dark');
    toggleMode();
    expect(themeStore.mode).toBe('light');
  });

  it('changes tier 2 only: the primitives are the same object on both sides', () => {
    // This is the whole claim of the three-tier pipeline. If it ever
    // stops holding, dark mode has started leaking into the other tiers.
    expect(themeStore.themes.light.palette).toBe(themeStore.themes.dark.palette);
  });

  it('routes a replacement by the theme its own meta declares', () => {
    const custom = defineTheme({
      meta: { name: 'custom dark', mode: 'dark' },
      semantic: semanticLight,
    });
    setTheme(custom);
    expect(themeStore.themes.dark.meta.name).toBe('custom dark');
    expect(themeStore.themes.light.meta.name).toBe('Dashforge Light');
  });
});

describe('component tokens', () => {
  it('overrides one value and leaves its siblings intact', () => {
    const t = defineTheme({
      meta: { name: 'squared', mode: 'light' },
      semantic: semanticLight,
      components: { Button: { tokens: { radius: { md: 0 } } } } as never,
    });
    expect(t.components.Button?.tokens?.radius.md).toBe(0);
    expect(t.components.Button?.tokens?.minHeight).toEqual({ sm: 36, md: 44, lg: 52 });
    expect(t.components.IconButton?.tokens?.radius.md).toBe(8);
  });

  it('gives the small size enough hitSlop to clear the 44pt floor', () => {
    const t = defineTheme({
      meta: { name: 't', mode: 'light' },
      semantic: semanticLight,
    });
    const b = t.components.Button?.tokens;
    expect(b!.minHeight.sm + b!.hitSlop.sm * 2).toBeGreaterThanOrEqual(44);
    expect(b!.minHeight.md + b!.hitSlop.md * 2).toBeGreaterThanOrEqual(44);
  });
});

describe('patchTheme', () => {
  it('reaches both modes by default, because most patches are structural', () => {
    patchTheme({ semantic: { radius: { control: 0 } } });
    expect(themeStore.themes.light.semantic.radius.control).toBe(0);
    expect(themeStore.themes.dark.semantic.radius.control).toBe(0);
  });

  it('leaves siblings alone when merging deep', () => {
    patchTheme({ semantic: { radius: { control: 2 } } });
    expect(themeStore.themes.light.semantic.radius.surface).toBe(12);
  });

  it('targets one mode when asked', () => {
    patchTheme({ semantic: { radius: { control: 4 } } }, 'dark');
    expect(themeStore.themes.dark.semantic.radius.control).toBe(4);
    expect(themeStore.themes.light.semantic.radius.control).toBe(8);
  });

  it('targets whichever mode is active', () => {
    setMode('dark');
    patchTheme({ semantic: { radius: { control: 6 } } }, 'active');
    expect(themeStore.themes.dark.semantic.radius.control).toBe(6);
    expect(themeStore.themes.light.semantic.radius.control).toBe(8);
  });
});

describe('mode storage', () => {
  it('reads a stored mode', async () => {
    const store = { getItem: async () => 'dark', setItem: async () => undefined };
    await expect(readStoredMode(store)).resolves.toBe('dark');
  });

  it('treats junk as no stored mode', async () => {
    const store = { getItem: async () => 'chartreuse', setItem: async () => undefined };
    await expect(readStoredMode(store)).resolves.toBeNull();
  });

  it('survives storage that throws, which it does in private mode', async () => {
    const store = {
      getItem: () => {
        throw new Error('nope');
      },
      setItem: () => {
        throw new Error('nope');
      },
    };
    await expect(readStoredMode(store)).resolves.toBeNull();
    await expect(writeStoredMode(store, 'dark')).resolves.toBeUndefined();
  });
});
