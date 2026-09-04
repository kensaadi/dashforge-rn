import { defaultComponentTokens } from '../tokens/components';
import { checkPaletteContract, formatViolations } from '../tokens/makePalette';
import { palette as defaultPalette } from '../tokens/palette';
import type { Theme, ThemeInput } from './theme.types';

/**
 * Resolve a theme input into a concrete theme.
 *
 * Each tier receives the ones below it, so a semantic token points at a
 * real primitive value and a component token points at a real semantic
 * value. No path strings, no late binding, and the compiler checks every
 * reference.
 *
 * @example
 * ```ts
 * const dark = defineTheme({
 *   meta: { name: 'Acme Dark', mode: 'dark' },
 *   semantic: ({ palette }) => ({ ...semanticDark,
 *     action: { ...semanticDark.action,
 *       primary: { ...semanticDark.action.primary, bg: palette.info['500'] } } }),
 *   components: ({ semantic }) => ({
 *     Button: { tokens: { radius: semantic.radius.pill } },
 *   }),
 * });
 * ```
 */
/**
 * Structural clone of plain-object trees.
 *
 * Not `structuredClone`: its presence on Hermes is not something to bet
 * a theme on, and the shapes here are plain data by construction.
 *
 * @internal
 */
function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(deepClone) as unknown as T;
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepClone(v);
  }
  return out as T;
}

export function defineTheme(input: ThemeInput): Theme {
  const palette = input.palette ?? defaultPalette;

  // `__DEV__` rather than `process.env.NODE_ENV`: it is the React Native
  // idiom, it is typed, and Metro strips the whole branch from a release
  // bundle instead of leaving a dead comparison in it.
  //
  // Checked in development and silent in production. A contrast problem
  // is worth interrupting a developer over and never worth interrupting
  // a user over, and a palette cannot change between the two anyway.
  //
  // A warning rather than a throw: the app still runs, the colours are
  // still the ones the consumer chose, and the message says which pair
  // failed, by how much, and the one call that fixes all of them.
  if (__DEV__) {
    const violations = checkPaletteContract(palette);
    if (violations.length > 0) console.warn(formatViolations(violations));
  }
  const semantic =
    typeof input.semantic === 'function' ? input.semantic({ palette }) : input.semantic;
  const overrides =
    typeof input.components === 'function'
      ? input.components({ palette, semantic })
      : (input.components ?? {});

  // Merged over the shipped defaults rather than replacing them, so
  // `components: { Button: { tokens: { radius: 0 } } }` overrides one
  // value and leaves the other twenty alone. Replacing wholesale would
  // make every override a full restatement, which is the thing this
  // architecture exists to avoid.
  const components = deepClone(defaultComponentTokens(semantic)) as typeof overrides;
  mergeInto(components as Record<string, unknown>, overrides);

  // Tiers 2 and 3 are cloned so each theme owns its values outright.
  // Without this, a `patchTheme(..., 'dark')` can reach into light: the
  // shipped semantic layers share their non-colour tokens by reference,
  // and a consumer composing themes with the spread operator would hit
  // the same trap. Tier 1 is deliberately *not* cloned: a primitive is
  // the same value in both modes, and sharing it is what makes the
  // mode swap provably a tier-2 operation.
  return {
    meta: input.meta,
    palette,
    semantic: deepClone(semantic),
    components,
  };
}

/** @internal Recursive merge, arrays replaced wholesale. */
function mergeInto(target: Record<string, unknown>, source: unknown): void {
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
      mergeInto(current as Record<string, unknown>, next);
    } else if (next !== undefined) {
      target[key] = next;
    }
  }
}
