/**
 * Playground themes.
 *
 * Five brands over the same library, and none of the ramps is written
 * out by hand: each is generated from a single seed colour by
 * `makePalette`, which is the point being demonstrated. An earlier
 * version of this file did hardcode the ramps, generated in HSL, and
 * three of the four failed the contrast contract while rendering
 * perfectly happily on screen.
 *
 * Only `primary` and its matching neutral change per brand. `success`,
 * `warning`, `danger` and `info` stay put, because those are meanings
 * rather than brand.
 */
import { defineTheme, type Theme } from '@dashforge/rn/theme';
import {
  makePalette,
  makeSemanticDark,
  makeSemanticLight,
} from '@dashforge/rn/tokens';

function brand(name: string, seed: string): { light: Theme; dark: Theme } {
  const p = makePalette({ primary: seed });
  return {
    light: defineTheme({
      meta: { name: `${name} Light`, mode: 'light' },
      palette: p,
      semantic: makeSemanticLight(p),
    }),
    dark: defineTheme({
      meta: { name: `${name} Dark`, mode: 'dark' },
      palette: p,
      semantic: makeSemanticDark(p),
    }),
  };
}

/**
 * Seeds, not ramps. Each is just "the brand colour" as a designer would
 * hand it over; where it sits on the lightness axis is discarded.
 */
export const THEMES = [
  { key: 'dashforge', label: 'Dashforge', seed: '#4c68ee' },
  { key: 'azzurro', label: 'Azzurro', seed: '#0093c7' },
  { key: 'violetto', label: 'Violetto', seed: '#7c3aed' },
  { key: 'teal', label: 'Teal', seed: '#0e7490' },
  { key: 'rame', label: 'Rame', seed: '#c2410c' },
].map(t => ({
  ...t,
  swatch: makePalette({ primary: t.seed }).primary['500'],
  themes: brand(t.label, t.seed),
}));

export type ThemeKey = (typeof THEMES)[number]['key'];
