/**
 * Bind a recipe to the component tokens it reads.
 *
 * A recipe cannot be a module constant, because its values come from the
 * theme and the theme is swappable at runtime. It also must not be
 * rebuilt per render. This closes both: the factory runs once per token
 * object, and the result is cached against that object's identity.
 *
 * A `WeakMap` rather than a `Map` so a theme that is replaced does not
 * pin its resolvers in memory forever. Identity is stable in practice
 * because valtio returns the same snapshot object while nothing under it
 * has changed.
 *
 * @example
 * ```ts
 * export const buttonRecipe = createRecipe((t: ButtonTokens) =>
 *   svSlots({ slots: { root: {}, label: {} }, variants: { ... } }),
 * );
 *
 * // in the component
 * const resolve = buttonRecipe(tokens);
 * const styles = resolve({ variant, color, size, state });
 * ```
 */
export function createRecipe<T extends object, R>(factory: (tokens: T) => R) {
  const cache = new WeakMap<T, R>();
  return function bind(tokens: T): R {
    let hit = cache.get(tokens);
    if (hit === undefined) {
      hit = factory(tokens);
      cache.set(tokens, hit);
    }
    return hit;
  };
}
