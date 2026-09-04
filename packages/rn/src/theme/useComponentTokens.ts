import type { ComponentTokens } from '../tokens/types';
import { useTheme } from './useTheme';

/**
 * The tier-3 token slice for one component.
 *
 * Always defined: `defineTheme` merges every theme over the shipped
 * defaults, so a consumer who overrides one value does not have to
 * restate the rest.
 */
export function useComponentTokens<K extends keyof ComponentTokens>(
  name: K,
): NonNullable<NonNullable<ComponentTokens[K]>['tokens']> {
  const theme = useTheme();
  const entry = theme.components[name] as { tokens?: unknown } | undefined;
  return entry?.tokens as NonNullable<NonNullable<ComponentTokens[K]>['tokens']>;
}

/**
 * The consumer-configured variant defaults for one component, the
 * `theme.components.<Name>.defaults` half of the props lane.
 *
 * Returns `undefined` when nothing is configured, which callers should
 * read as "use the recipe's own `defaultVariants`".
 */
export function useComponentDefaults<K extends keyof ComponentTokens>(
  name: K,
): NonNullable<ComponentTokens[K]>['defaults'] | undefined {
  const theme = useTheme();
  const entry = theme.components[name] as { defaults?: unknown } | undefined;
  return entry?.defaults as NonNullable<ComponentTokens[K]>['defaults'] | undefined;
}
