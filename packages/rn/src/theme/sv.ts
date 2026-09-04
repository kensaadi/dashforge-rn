import {
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

/** Any of the three React Native style shapes. */
export type StyleObject = ViewStyle | TextStyle | ImageStyle;

/** `{ size: { sm: {...}, md: {...} } }` */
export type VariantMap = Record<string, Record<string, StyleObject>>;

/** Loosest shape both the plain and the slotted maps satisfy. @internal */
type AnyVariantMap = Record<string, Record<string, unknown>>;

/** The string keys of one axis. `keyof` alone widens to include symbols. */
type AxisValues<V extends AnyVariantMap, K extends keyof V> = Extract<
  keyof V[K],
  string
>;

/**
 * The props a recipe accepts, derived from its own axes.
 *
 * An axis keyed only `true` / `false` additionally accepts a real
 * boolean, so `fullWidth` reads as a flag at the call site rather than
 * as the string `'true'`.
 */
export type VariantProps<V extends AnyVariantMap> = {
  [K in keyof V]?: AxisValues<V, K> extends 'true' | 'false'
    ? AxisValues<V, K> | boolean
    : AxisValues<V, K>;
};

type Selector<V extends AnyVariantMap> = {
  [K in keyof V]?: AxisValues<V, K> | boolean;
};

export interface SvConfig<V extends VariantMap> {
  /** Applied first, under every variant. */
  base?: StyleObject;
  variants?: V;
  /** Applied last, in array order, when every key they name matches. */
  compoundVariants?: Array<Selector<V> & { style: StyleObject }>;
  defaultVariants?: Selector<V>;
}

/**
 * Build a variant resolver.
 *
 * **Why this exists rather than a merge at render time.** NativeBase, the
 * most popular props-driven React Native library, was deprecated by its
 * own authors because its styling engine resolved everything at runtime
 * and ended up slower than plain React Native. Its successor bought its
 * way out with a Babel plugin. We refuse a build step, so the only route
 * left is to resolve once and look up thereafter.
 *
 * Each reachable combination is compiled on first use into a single
 * `StyleSheet` entry and cached. Rendering is a `Map.get`: no iteration
 * over compound variants, no object spreading, no array building.
 * Compilation is lazy rather than exhaustive because an application
 * touches a handful of the hundreds of combinations a recipe can express,
 * and paying for all of them at startup is paying for nothing.
 *
 * The output is one pre-merged style, not an array. The array a component
 * finally hands React Native is `[resolved, sx]`: two entries, so the
 * override contract stays intact while the variant work is already done.
 *
 * @example
 * ```ts
 * const chip = sv({
 *   base: { flexDirection: 'row', alignItems: 'center' },
 *   variants: {
 *     size: { sm: { height: 24 }, md: { height: 32 } },
 *     selected: { true: { borderWidth: 2 }, false: { borderWidth: 1 } },
 *   },
 *   defaultVariants: { size: 'md', selected: false },
 * });
 *
 * chip({ size: 'sm', selected: true });
 * ```
 */
export function sv<V extends VariantMap>(config: SvConfig<V>) {
  const cache = new Map<string, StyleObject>();
  const axes = Object.keys(config.variants ?? {});

  return function resolve(props?: VariantProps<V>): StyleObject {
    const chosen = select(
      axes,
      config.defaultVariants,
      props as Selector<V> | undefined,
    );
    const key = cacheKey(axes, chosen);
    let hit = cache.get(key);
    if (hit === undefined) {
      hit = compile(config, chosen);
      cache.set(key, hit);
    }
    return hit;
  };
}

/** Per-slot variant styles, for compound components. */
export type SlotVariantMap<S extends string> = Record<
  string,
  Record<string, Partial<Record<S, StyleObject>>>
>;

export interface SvSlotsConfig<
  Slots extends Record<string, StyleObject>,
  V extends SlotVariantMap<keyof Slots & string>,
> {
  slots: Slots;
  variants?: V;
  compoundVariants?: Array<
    Selector<V> & { style: Partial<Record<keyof Slots & string, StyleObject>> }
  >;
  defaultVariants?: Selector<V>;
}

/**
 * The slotted form, for components whose parts are styled independently
 * (a field's root, label, input and helper). Same caching, same single
 * pre-merged style per slot.
 */
export function svSlots<
  Slots extends Record<string, StyleObject>,
  V extends SlotVariantMap<keyof Slots & string>,
>(config: SvSlotsConfig<Slots, V>) {
  type S = keyof Slots & string;
  type Resolved = { [K in keyof Slots]: Slots[K] };

  const cache = new Map<string, Resolved>();
  const axes = Object.keys(config.variants ?? {});
  const slotNames = Object.keys(config.slots) as S[];

  return function resolve(props?: VariantProps<V>): Resolved {
    const chosen = select(
      axes,
      config.defaultVariants,
      props as Selector<V> | undefined,
    );
    const key = cacheKey(axes, chosen);
    let hit = cache.get(key);
    if (hit === undefined) {
      const out = {} as Resolved;
      for (const slot of slotNames) {
        out[slot] = compile(
          {
            base: config.slots[slot],
            variants: pluckSlot(config.variants, slot),
            compoundVariants: config.compoundVariants
              ?.filter((c) => c.style[slot] !== undefined)
              .map((c) => ({ ...c, style: c.style[slot] as StyleObject })),
          } as SvConfig<VariantMap>,
          chosen,
        ) as Resolved[S];
      }
      hit = out;
      cache.set(key, hit);
    }
    return hit;
  };
}

/** @internal Fill every axis from props, then defaults. */
function select(
  axes: string[],
  defaults: Record<string, unknown> | undefined,
  props: Record<string, unknown> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) {
    const value = props?.[axis] ?? defaults?.[axis];
    if (value !== undefined && value !== null) out[axis] = String(value);
  }
  return out;
}

/**
 * @internal Stable key. Built from the declared axis order rather than
 * from `Object.keys` of the props, so two callers passing the same values
 * in a different order hit the same cache entry.
 */
function cacheKey(axes: string[], chosen: Record<string, string>): string {
  let key = '';
  for (const axis of axes) key += `${chosen[axis] ?? ''}|`;
  return key;
}

/** @internal base, then each axis in declaration order, then matching compounds. */
function compile(
  config: SvConfig<VariantMap>,
  chosen: Record<string, string>,
): StyleObject {
  const merged: Record<string, unknown> = { ...(config.base ?? {}) };

  for (const [axis, values] of Object.entries(config.variants ?? {})) {
    const picked = chosen[axis];
    if (picked !== undefined && values[picked]) Object.assign(merged, values[picked]);
  }

  for (const compound of config.compoundVariants ?? []) {
    const { style, ...selector } = compound;
    const matches = Object.entries(selector).every(
      ([axis, value]) => chosen[axis] === String(value),
    );
    if (matches) Object.assign(merged, style);
  }

  return StyleSheet.create({ s: merged as StyleObject }).s;
}

/** @internal Project a slotted variant map down to one slot. */
function pluckSlot<S extends string>(
  variants: SlotVariantMap<S> | undefined,
  slot: S,
): VariantMap {
  const out: VariantMap = {};
  for (const [axis, values] of Object.entries(variants ?? {})) {
    const axisOut: Record<string, StyleObject> = {};
    for (const [value, slots] of Object.entries(values)) {
      const style = (slots as Partial<Record<S, StyleObject>>)[slot];
      if (style) axisOut[value] = style;
    }
    out[axis] = axisOut;
  }
  return out;
}
