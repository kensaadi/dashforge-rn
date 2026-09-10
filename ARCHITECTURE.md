# @dashforge/rn — Founding Architecture

The rules for building the React Native renderer. Normative: when an
implementation choice contradicts this document, the document wins or
the document gets amended first. Not a roadmap, does not track
progress.

**This is a new project.** It is built on the Dashforge core (the
reactive engine, the form bridge, RBAC, the token-first philosophy). It
is **not** derived from `@dashforge/tw` or `@dashforge/ui`. Those are
web renderers, and their decisions are answers to web problems.
Reaching for one of them as a template is how a mobile library ends up
feeling like a website in a phone. Where guidance is needed, it comes
from the React Native ecosystem, not from the web packages in this
monorepo.

---

## 1. What this package is

A React Native UI library, token-first, props-driven, with the shared
Dashforge behaviour layer underneath.

```
  @dashforge/rn          components
  @dashforge/rn-theme    theme store, sv() engine, providers
  @dashforge/rn-tokens   token interfaces + default themes

  CORE (shared, consumed unchanged)
  ui-core · forms · rbac · calendar-core
```

### What comes from the Dashforge core

Four packages, and the reason this is a Dashforge library rather than
another RN component kit:

- **`@dashforge/ui-core`** — the reactive engine. Nodes, rules,
  dependency tracking, visibility predicates, the `DashFormContext`
  bridge contract.
- **`@dashforge/forms`** — the form runtime over react-hook-form.
  Registration, per-field reactive snapshots, field arrays, reactions.
- **`@dashforge/rbac`** — the permission engine. Every interactive
  component takes an `access` requirement and resolves to
  hidden / disabled / read-only centrally.
- **`@dashforge/calendar-core`** — date grid, ISO handling, locale,
  range logic. Deliberately DOM-free from the start.

### The rule that BUG 10 taught us

**A package shared by both renderers must render no DOM elements.**
React Native has no `div`, no `span`, no `input`, no `form`. It looks a
lowercase tag up in its own native view registry, does not find it, and
throws before anything of ours renders:

```
View config getter callback for component `form` must be a function
(received `undefined`).
```

The audit that was done before this library existed grepped for browser
*globals*: `document`, `window`, `HTMLElement`, `navigator`,
`localStorage`. All clean, and the conclusion "DOM-free" was written
here on that basis. It was wrong, because the grep never looked for JSX
host elements, and `@dashforge/forms` renders a literal `<form>` inside
`DashForm`.

So the check is: **grep the shipped files for host elements, not only
for browser globals.** `src/__tests__/dom-free.test.ts` does exactly
that on every run, over the compiled output of all four core packages
and of this one, against a list of what is known and why. A new one
arriving fails the suite.

Two things the test cannot be replaced by. The test renderer does not
catch this: it is permissive about unknown host components and renders
`DashForm` without a word, so only a device tells you. And a code review
will not either, because the offending line is one JSX tag in somebody
else's package.

**What is allowed, and why.** `@dashforge/forms` ships `<form>` inside
`DashForm`, which is the provider plus a form element for the browser's
native submit. That is correct on the web and unusable here, so React
Native uses `DashFormProvider`, the provider alone, and calls
`rhf.handleSubmit` from a button. It is BUG 10 in the monorepo's
register, not a design mistake: the component is not wrong, it is DOM.

One consumption rule that is easy to get wrong: aggregate form flags
(`isDirty`, `isValid`, `isSubmitting`) are read with
`useDashFormState()` **in the component that needs them**. RHF's
`formState` is a Proxy that subscribes only what a component actually
reads, so subscribing in the consumer is what makes it re-render, and
it avoids a cascade on every keystroke.

### What is new here

Everything visual and everything interactive. Tokens, theme runtime,
style engine, component anatomy, the catalog itself. None of it is
ported.

### The four things that make a component "Dashforge"

These are the product, and they are what a consumer is actually buying.
Every component honours all four or it is not finished:

1. **Props, not styles.** Every meaningful visual decision that can be
   a typed prop, is one. Consumers describe intent (`variant`, `color`,
   `size`), not appearance. The working target is 90% of real usage
   served by props alone, with `useTheme()` for custom composition and
   `sx` as the rare exception. See section 9.
2. **RBAC-aware.** An `access` prop on every interactive component.
3. **Bridge-integrated.** Form controls work inside a `DashForm` and
   standalone, with identical prop surface.
4. **Configured declaratively.** Everything a component can look like
   traces to a token, and every token is overridable from the theme: a
   primitive value, a semantic meaning, or that one component's tokens
   and defaults. No wrapper components, no forked variants, no code.
   See section 6.

---

## 2. What the React Native ecosystem teaches

Studied because they solved this problem before us, and two of them
solved it badly enough to be worth more than the ones that got it
right.

### The NativeBase lesson (the important one)

NativeBase was the most popular props-driven RN library and it was
deprecated by its own authors. The reason, in their words: the styling
engine was **all runtime**, and with the feature set they had piled on,
it was slower than plain React Native. Bundle size was the second
complaint: everything in one bundle, tree-shaking mandatory to get it
back down.

This matters to us more than to anyone, because **Dashforge is a
props-driven library**, which is exactly the shape that died. The
successor, gluestack-ui, exists mostly to fix it, and did so with a
Babel plugin that precomputes styles at build time.

We refuse a build step (see section 4), so we cannot buy our way out
the way gluestack did. That leaves one option: **resolve statically or
not at all.** It is the single hardest constraint on `sv()` and it is
why section 6 is written the way it is.

### Tamagui

An optimizing compiler that flattens the component tree and hoists
styles. Best-in-class performance on native and dramatically so on web.
The cost is the compiler: a build-time dependency, its own token
system, and an ecosystem you are inside rather than on top of.

Take from it: the variant API shape is the best-designed in the space,
and the idea that a design system should be able to state a whole
component's appearance declaratively rather than imperatively.

Leave: the compiler, and the assumption that a UI library gets to own
the consumer's build.

### gluestack-ui

Unstyled accessible primitives plus copy-paste distribution. The
consumer owns the code, so imposing a Babel plugin on them is fair.

Take from it: component anatomy. Their decomposition of a compound
component into named parts is careful and worth studying before we
name our own slots.

Leave: copy-paste distribution. Dashforge sells a versioned library
with a support story, which is the opposite trade.

### Shopify Restyle

The closest to Dashforge philosophically: token-first, TypeScript-first,
props tied directly to theme values, tiny, pure runtime, no build step.
It is a library for building libraries.

Take from it: theme-as-source-of-truth with props that name tokens
rather than values, and the discipline of keeping the runtime small
enough that being runtime does not matter.

Leave: it stops at primitives. It has no component catalog, no
accessibility opinions, no behaviour. That is the half we have to
build.

### React Native Paper

Material Design 3, from Callstack. The accessibility bar in the
ecosystem: 48x48dp touch targets and screen reader labels handled
without the consumer asking.

Take from it: accessibility as a default rather than a prop, and the
touch target discipline.

Leave: Material on both platforms. It is the clearest example of a
library imposing one platform's visual language everywhere, and on iOS
it reads as foreign. Our answer to the same question is in section 3
and it is different.

### Unistyles v3

A styling engine, not a component library. Technically excellent, with
styles that update without re-rendering. Its core is C++ through Nitro
Modules, so it requires a native build and rules out Expo Go for
anyone installing it.

Take from it: the ambition of updating styles without a re-render.

Leave: the native dependency. Re-evaluate only if a JS-only mode ships.

---

## 3. Platform fidelity: the three buckets

The question "do we respect the OS or impose our own design" has three
different answers depending on what is being asked about. Conflating
them is the mistake Paper makes in one direction and most branded apps
make in the other.

**Bucket 1 — Appearance. Dashforge decides, identical on both.**
Colour, radius, spacing, typography, elevation language, density,
component anatomy. If appearance varied per OS, the tokens would
produce two identities and the token-first premise collapses. Every
brand-led product does it this way.

**Bucket 2 — Behaviour. The OS decides.**
Press feedback, haptics, scroll physics, keyboard avoidance, back
navigation, accessibility semantics, text selection, safe area. This is
where users actually notice foreignness. A button that does not ripple
on Android does not read as branded, it reads as broken.

**Bucket 3 — System surfaces. Delegate, never reimplement.**
Date and time pickers, action sheets, alerts, share sheets,
permissions, photo and contact pickers. Reimplementing these is
uncanny-valley work that also breaks when the OS changes.

Bucket 3 has a concrete consequence: single date and time selection
should open the platform picker. A custom calendar grid is justified
only where the platform has nothing good, which in practice means date
**ranges**. `calendar-core` is there for that case and only that case.

---

## 4. Non-negotiables

1. **No build-step dependency.** Installing is `pnpm add @dashforge/rn`.
   The consumer never edits `metro.config.js` or `babel.config.js`
   because of us. This rules out NativeWind, Tamagui's compiler, and
   any engine needing a native build (Unistyles v3 included).

2. **Pure React Native. Expo is a consumer, never a dependency.**
   Nothing in these packages imports `expo-*`, requires an Expo config
   plugin, an `app.json` entry, a prebuild, or a dev client. If a
   feature can only be delivered through Expo, that feature does not
   ship in the library. It ships as an interface the app implements.

   The direction of proof matters: the library is developed and
   verified against a **bare React Native CLI app**. Expo is a superset,
   so bare-passes-therefore-Expo-passes holds, and the reverse does
   not. Testing only on Expo would let an Expo assumption in without
   anyone noticing.

3. **No native modules.** No `react-native-*` or `@react-native-*`
   package that requires linking, a pod install, or a Gradle change.
   A consumer must be able to add this library to an existing app and
   run it without touching the native projects. See section 5.1 for
   how capabilities that genuinely need native code are delivered
   anyway.

4. **No DOM, ever.** No `react-dom`, no `document`, `window`,
   `HTMLElement`, `navigator`, `localStorage`, no `@radix-ui/*`.

5. **The core is consumed, never forked.** A bug in `ui-core`, `forms`,
   `rbac` or `calendar-core` is fixed there, for every renderer, not
   worked around here.

6. **Runtime dependencies stay at three.** `react`, `react-native`,
   `valtio`, plus the four core packages. Everything else is a peer,
   optional, and injected. NativeBase's second complaint was bundle
   size and we are not repeating it.

7. **Everything flows primitive -> semantic -> component.** One
   direction, no shortcuts. A component reads its own tokens and
   nothing above them. See section 6.

8. **Static resolution or nothing.** See section 7. A style computed
   per render, per component instance, is a defect.

9. **`sx` is the only styling escape hatch.** No `className`, no
   documented `style` pass-through, no `slotProps`, no `classes`, no
   `styled()`.

10. **Accessibility is a default, not a prop.** Touch targets, roles and
   state are correct without the consumer configuring anything.

11. **Every public prop carries JSDoc** with description and `@default`.
   This feeds `pnpm sync:props` and the IDE hover. No exceptions.

---

## 5. The package

**One package, `@dashforge/rn`, with subpath entry points.**

| Entry | Contains |
|---|---|
| `@dashforge/rn` | the components |
| `@dashforge/rn/theme` | theme store, provider, `sv()`, `useTheme()`, `useComponentDefaults` |
| `@dashforge/rn/tokens` | token interfaces, default light and dark themes |

Runtime dependencies: `valtio`, plus `ui-core`, `forms`, `rbac` and
`calendar-core` consumed from npm. `react` and `react-native` are
peers.

`sv()` and `useTheme()` sit behind `/theme` rather than inside the
component barrel because they are public API for consumers building
their own components on Dashforge tokens, not internals. The boundary
is real; it just does not need three version lines, three changelogs
and a compatibility matrix between packages that always ship together.

Splitting later stays possible without breaking imports: a real
`@dashforge/rn-tokens` package can be extracted and re-exported from
the subpath.

**Resolver note.** Metro only honours the `exports` field on recent
versions, so the subpaths also ship as directory stubs
(`theme/package.json`, `tokens/package.json` pointing into `dist`).
Both mechanisms, because one of them costs two files and removes a
class of resolution bug on the supported floor.

### 5.1 Native capabilities are injected, never imported

Some things genuinely need native code. Rules 2 and 3 say we cannot
depend on them, but that must not mean we refuse the feature. The
resolution is one pattern applied everywhere: **the library defines the
interface and ships a no-op default; the app supplies the
implementation.**

| Capability | Why it cannot be a dependency | How it ships |
|---|---|---|
| Mode persistence | AsyncStorage and MMKV are native modules | `ModeStorage` adapter on the provider. Without one, mode is not persisted, which is a valid configuration |
| Haptics | `expo-haptics` is Expo, `react-native-haptic-feedback` needs linking | `HapticsAdapter` on the provider. Without one, presses are silent |
| Date and time pickers | every real picker is a native module | Date fields ship as **trigger plus headless controller**: we own the field, the formatting, the form binding, validation and accessibility; the app plugs in the picker it wants. `calendar-core` powers the JS fallback and the range case |
| Icons | `@expo/vector-icons` is Expo, every icon set is a dependency | icons are `ReactNode` props. We never adopt a set |
| Safe area insets | `react-native-safe-area-context` is a native module | components take insets as props |
| Fonts | loading differs between bare and Expo | system font by default, custom family through a token the app has already loaded |

Every adapter is optional, every default is a working no-op, and no
absent adapter ever throws. A consumer with none of them installed gets
a fully functional library with a smaller feature set, which is the
correct trade.

This pattern is also what keeps rule 6 true. The dependency count does
not grow as the feature list does.

**The boundary of this pattern.** An adapter only works where absence
can degrade to silence. Storage and haptics can be missing and the
library still works; a capability that must draw something cannot. Any
such capability is out of scope for the core entirely. It is not a
peer, not an optional dependency, and not something the core degrades
around. None are planned.

**Haptic intents.** The adapter speaks in intentions, not in
durations, so the vocabulary is fixed once and every component uses the
same words:

```ts
type HapticIntent =
  | 'selection'                                    // crossing a value
  | 'impactLight' | 'impactMedium' | 'impactHeavy' // something landed
  | 'success' | 'warning' | 'error';               // an outcome

type HapticsAdapter = { trigger(intent: HapticIntent): void };
```

Defined from the first component even though call sites land
incrementally, for the same reason as the functional `sx`: naming the
vocabulary after forty components exist costs an order of magnitude
more. Used for state changes felt without looking (a `Switch`
flipping, a `Slider` crossing a detent, a swipe passing its threshold,
a destructive confirmation), never on every button press. RN's built-in
`Vibration` API is **not** a fallback: it produces the heavy system
buzz where a light tick is expected, which is worse than silence.

## 6. The token pipeline

Everything resolves through three tiers, in one direction only:

```
   PRIMITIVE  ->  SEMANTIC  ->  COMPONENT  ->  the rendered style
   raw values     meaning       usage
```

This is the spine of the library. It is what makes the whole thing
configurable declaratively rather than by forking components, and it is
what makes dark mode a property of one tier instead of a concern spread
across forty.

### Tier 1: primitive

Raw values with no meaning attached. Named by what they are, never by
what they are for.

```ts
palette: { blue: {50..950}, slate: {50..950}, red: {...}, amber: {...}, green: {...} }
size:    { 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, ... }
```

**No component may ever reference a primitive.** A `.variants.ts` file
containing `palette.blue[500]` is as much a defect as one containing
`'#3b82f6'`. Primitives exist to be pointed at by tier 2 and by nothing
else.

Roles like `primary` and `danger` are **not** primitives. They are
meanings, so they live in tier 2. This is what makes a rebrand a
remapping rather than a repaint: point `action.primary` at a different
hue and every component follows, with no scale rewritten.

### The ramps are tone scales, not arbitrary numbers

Generated in **CIE LCh at fixed L\* tones**. L\* is the axis Material 3
calls "tone", and it uses it because L\* is perceptual lightness: a step
means the same lightness for a green as for a blue. HSL lightness does
not, which is measurable rather than theoretical (a red at HSL 50% reads
lighter than a blue at HSL 50%), and a palette built on it needs
hand-tuning per hue to stay legible. We had that tuning, and this
removed it.

On a tone axis Material's arithmetic applies, and legibility stops being
something to search for:

> two tones **40 apart** contrast at least **3:1**
> two tones **50 apart** contrast at least **4.5:1**

Every step therefore has a job, listed in `palette.ts`, and the pairs
that matter hold for every hue by construction. `contrast.test.ts`
asserts each pair rather than trusting it, including that the measured
values for all five chromatic roles land within 0.3 of each other:
"each passes" would still allow one hue to be passing by luck.

**Label polarity follows Apple, not Material.** Material's uniformity
comes from putting every fill at the same tone. It works, and it turns
an amber into an ochre and a green into a bottle green. Apple keeps
`systemOrange` and `systemYellow` vivid and darkens the label instead.
We take Apple's side: the roles in `darkLabelRoles` (by default
`success` and `warning`) keep their hue at a vivid tone and pair with a
dark label. A declaration in the palette, not a rescue at runtime.

**`PlatformColor` is not used for anything we render.** It would give
colours that adapt to every system setting for free, but iOS blue and
Android blue are different colours, and section 3 says appearance is
ours. It stays the right escape hatch for an app that deliberately wants
the platform look, and the README says so.

### Tier 2: semantic

What a value is *for*. The only layer that swaps, and it swaps on
**three** axes rather than two: light, dark, and the platform's
**Increase Contrast** setting. Both operating systems expose that
setting and both adapt their own colours to it, so ignoring it is a gap
rather than a scope decision. The factories take
`{ highContrast: true }`, which deepens text, strengthens borders and
makes separators opaque: a translucent hairline is the first thing to
disappear for somebody who has asked for more edge.

The role names follow Apple's hierarchy: text
(primary / secondary / muted / disabled), surfaces
(base / raised / sunken / overlay), a separate `fill` scale for non-text
elements that are not actions, and two separators, translucent and
opaque, because a hairline that lets content through is not the same
component as one that must not.

```ts
semantic: {
  surface:  { base, raised, sunken, overlay, inverse },
  text:     { primary, secondary, muted, disabled, inverse, onAccent },
  border:   { subtle, default, strong, focus },
  action:   { primary:  { bg, bgPressed, bgDisabled, fg, border },
              secondary: {...}, danger: {...}, success: {...}, warning: {...} },
  feedback: { success: { bg, fg, border }, warning: {...}, danger: {...}, info: {...} },
  overlay:  { scrim },

  radius:     { control, surface, pill },
  space:      { inline, stack, inset, section },
  elevation:  { flat, raised, floating, modal },
  typography: { display, title, subtitle, body, label, caption, mono },
  motion:     { instant, quick, standard, deliberate },
}
```

Semantic naming applies to non-colour tokens too, and this is not
decoration. `radius.control` means "the radius every control has" is
**one decision recorded once**, rather than twenty components each
independently choosing `radius.md` and drifting. Same for
`elevation.floating`, `space.inset`, `typography.label`.

Typography entries are composite: family, size, weight and line height
together. A component asks for `typography.label` and gets a coherent
set, because those four are never independently chosen in practice.

### Tier 3: component

What a specific component uses. Every component declares its own token
surface, and this is the layer a consumer configures.

```ts
components: {
  Button: {
    defaults: { variant: 'solid', color: 'primary', size: 'md' },
    tokens: {
      radius:     semantic.radius.control,
      typography: semantic.typography.label,
      height:     { sm: 36, md: 44, lg: 52 },
      solid: {
        primary: { bg:        semantic.action.primary.bg,
                   bgPressed: semantic.action.primary.bgPressed,
                   fg:        semantic.action.primary.fg },
      },
    },
  },
}
```

**A `.variants.ts` recipe reads component tokens and nothing else.** Not
primitives, not semantics, not literals. If a component needs a value
it does not have a token for, the fix is to add the component token,
not to reach up a tier.

That rule is what makes the configuration complete: if every style a
component can produce traces to a component token, then every style a
component can produce is configurable from the theme.

### Authoring

The theme is authored as a function so each tier references the one
below it with real values and full type checking. No string paths, no
stringly-typed lookups:

```ts
const theme = defineTheme({
  palette: {...},
  semantic: ({ palette }) => ({...}),
  components: ({ semantic }) => ({ Button: {...}, TextField: {...} }),
});
```

A consumer overriding anything writes the same shape, at whichever tier
they need, and nothing else changes:

```ts
patchTheme({
  semantic: { action: { primary: { bg: palette.violet[600] } } },   // rebrand
  components: { Button: { defaults: { size: 'lg' },                 // every button
                          tokens: { radius: 0 } } },                // squared buttons
});
```

No wrapper components, no forked variants, no code. **Everything is
declarative configuration.** This is the promise of the library and it
is checked by the rule above: a component that hardcodes anything has
broken it.

---

## 7. The style engine

React Native offers one mechanism: a `style` prop taking an object, or
an array of objects merged last-wins per property. No cascade, no
inheritance, no selectors, no pseudo-classes. Every RN styling library
is a layer that eventually produces that array.

We do not add a layer. `sv()` maps a set of variant values to the
correct array.

### The constraint that shapes it

From the NativeBase lesson in section 2: a props-driven library dies of
runtime style resolution. We refuse a build step, so we cannot
precompute the way gluestack did. That leaves resolving **statically at
theme resolution time**:

- A recipe is a **function of its component tokens**, not a module
  constant, because component tokens come from the theme and the theme
  is runtime-swappable. `createRecipe` binds the two and caches against
  the token object's identity.
- Each reachable combination is compiled into a single `StyleSheet`
  entry **on first use**, and cached. Not exhaustively at theme
  resolution: `Button` alone expresses 4 variants x 5 roles x 3 sizes x
  3 states x 2 widths, and an application touches a handful of those.
  Paying for all of them at startup is paying for nothing.
- Rendering is a **lookup by key**. It does not iterate
  `compoundVariants`, does not spread objects, does not build arrays.
  The same props return the identical object, so downstream `React.memo`
  comparisons keep working.
- The output is **one pre-merged style, not an array**. The array a
  component finally hands React Native is `[resolved, sx]`: two entries,
  so the override contract stays intact while the variant work is
  already done.
- A theme swap produces a new resolver with a fresh cache. Not once per
  component, and never per render.

If a variant axis ever grows large enough that its product is not
enumerable, that is the signal it should be a runtime prop rather than
a variant. Say so in review.

### Authoring shape

```ts
export const buttonRecipe = defineRecipe('Button', (t) => ({
  base: {
    borderRadius: t.radius,
    ...t.typography,
  },
  variants: {
    variant: { solid: {...}, outline: {...}, ghost: {...} },
    color:   { primary: {}, secondary: {}, danger: {}, success: {}, warning: {} },
    size:    { sm: { height: t.height.sm }, md: {...}, lg: {...} },
    state:   { rest: {}, pressed: {}, disabled: {} },
  },
  compoundVariants: [
    { variant: 'solid', color: 'primary', state: 'rest',
      style: { backgroundColor: t.solid.primary.bg } },
    { variant: 'solid', color: 'primary', state: 'pressed',
      style: { backgroundColor: t.solid.primary.bgPressed } },
  ],
  defaultVariants: { variant: 'solid', color: 'primary', size: 'md', state: 'rest' },
}));
```

`t` is the component's own token slice, tier 3. Nothing else is in
scope, which makes the rule enforceable by the type system rather than
by review.

Compound components declare `slots` and the recipe returns one resolver
per slot.

### Rules

- **No literals, no primitives, no semantics in a recipe.** Component
  tokens only. Exceptions are values that genuinely have no token
  (`flex: 1`, `overflow: 'hidden'`) and platform constants.
- If a value is needed and no component token exists, **add the
  component token**, and if it has no semantic to point at, add that
  too. This is how the token set stays complete and how the library
  stays configurable.
- Registry compilation is pure. A recipe may not read context, state,
  or anything outside its token slice.

---

## 8. Theme runtime

- Valtio store holding the active theme.
- **Dark mode swaps tier 2 only.** Primitives do not change: `blue.500`
  is `blue.500` in both modes. Component tokens do not change either,
  because they point at semantics. Only the semantic layer is
  re-pointed, so `surface.base` resolves to a light value in one mode
  and a dark one in the other. No component knows a mode exists, and no
  component needs a dark branch.
- `Appearance.getColorScheme()` plus `addChangeListener` for the system
  preference.
- Actions: `setTheme`, `setMode`, `toggleMode`, `patchTheme` (deep
  merge at any tier, arrays replaced wholesale).
- A theme change recompiles the recipe registry once, then notifies
  subscribers. See section 7.
- Provider: `DashforgeNativeProvider`.

**Storage is injected, never imported.** No dependency on
`@react-native-async-storage/async-storage`. The provider accepts an
optional adapter:

```ts
type ModeStorage = {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
};
```

With no adapter, mode is not persisted across launches, and that is a
valid configuration. Wrap every call in try/catch.

---

## 9. The consumer API

Three levels, in the order a consumer should reach for them. The
proportions matter: if the second and third are common, the first is
incomplete and that is a defect in the library, not in the consumer.

### Level 1: props (the target is 90%)

**Every design decision that can become a typed prop, becomes one.**
Consumers describe intent and the library resolves it against tokens.
They should never need to know what `surface.raised` evaluates to.

The test for whether something is a prop: *would two competent
developers, given the same intent, style it the same way?* If yes, it
is a prop and the library owes them one. If it is genuinely one-off,
it is `sx`.

Two shapes of prop, and the distinction is what keeps the runtime
cheap:

- **Variant props** on every component: `variant`, `color`, `size`,
  `tone`, `density` and the like. Finite enumerations, compiled into
  the static registry (section 7), free at render time.
- **Token-named props** on layout primitives only (`Box`, `Stack`):
  a short, explicit, closed list where the value names a token rather
  than a raw value, resolved through a memoized lookup.

```tsx
<Box bg="surface.raised" p="inset" radius="surface" elevation="raised" />
```

**Hard boundary: no open-ended style props.** We do not ship forty
individual CSS-shaped props, and we do not accept arbitrary style keys
as props. That is precisely the runtime-resolution surface that killed
NativeBase (section 2). The layout prop list is closed, reviewed, and
short. Growing it is a deliberate decision, not a convenience.

### Level 2: `useTheme()` for custom work

A consumer will build things we do not ship: a bespoke screen, a
one-off composite, their own component. **When they do, they must be
able to stay on the design system**, and the only way that happens is
if reading a token is easier than typing a hex value.

```tsx
const theme = useTheme();

<View style={{
  backgroundColor: theme.semantic.surface.raised,
  padding:         theme.semantic.space.inset,
  borderRadius:    theme.semantic.radius.surface,
}} />
```

Rules:

- Returns the **fully resolved** theme, all three tiers, with real
  values. Never path strings, never a lookup function the consumer has
  to learn.
- **Reactive and granular.** Backed by the valtio snapshot, so a
  component re-renders only for the tokens it actually read. Reading
  `semantic.surface.raised` does not re-render on a typography change.
- Fully typed, so the whole token tree autocompletes. This is what
  makes it faster than typing a hex value, which is the only thing
  that makes people use it.
- **App code should read the semantic tier.** Primitives are reachable
  but are the wrong level for application code, exactly as they are for
  our components. Document it that way.
- `sv()` is exported too, so a consumer can build their own
  variant-driven component on Dashforge tokens with the same engine we
  use, rather than reinventing a worse one.

`useTheme()` is the reason a Dashforge app looks coherent even in the
parts Dashforge did not build.

### Level 3: `sx` (rare)


`sx` is the entire styling API for consumers.

```ts
sx?: StyleProp<ViewStyle>   // containers
sx?: StyleProp<TextStyle>   // text-rendering components
sx?: StyleProp<ImageStyle>  // images
```

`StyleProp<T>` already accepts an inline object, a `StyleSheet.create`
entry, an array of either, and falsy entries. It is also type-checked,
so a misspelled property fails to compile.

#### Functional form

```ts
type DashPressState = { pressed: boolean; focused: boolean; disabled: boolean };

sx?: StyleProp<ViewStyle> | ((state: DashPressState) => StyleProp<ViewStyle>);
```

No `hovered`. Hover does not exist on touch devices. This must be in
from the first component; retrofitting it across a catalog later is far
more expensive.

#### Compound components

`sx` is a typed slot map for components with internal parts:

```tsx
<Button sx={{ marginLeft: 16 }} />

<TextField sx={{
  root:  { marginBottom: 24 },
  label: { fontWeight: '600' },
  input: { fontFamily: 'Menlo' },
}} />
```

Flat on atomic components, slot map on compound ones. Never unioned on
the same component, so there is no runtime ambiguity between a style
object and a map of them.

Where composition is the better answer, expose subcomponents instead of
slots. Slots are for parts a consumer cannot compose, such as the label
and helper text of a field.

#### Precedence

Two lanes. Everything above `sx` is declarative configuration; `sx` is
the imperative escape hatch and it is always last.

```
  tokens:  primitive -> semantic -> component tokens
                                       |
  props:   defaultVariants -> theme.components.<Name>.defaults -> instance props
                                       |
  style:   compiled recipe output -> theme.components.<Name>.sx -> instance sx
```

Read it as: the token pipeline decides what a variant *means*, the
props lane decides which variant applies, the style lane applies it and
then allows overriding.

Instance `sx` wins over everything, always, with no exceptions. RN array
merge is genuinely last-wins per property, with no specificity and no
dependence on emission order, so this guarantee is real rather than
aspirational.

**`sx` should be rare.** If a consumer reaches for it repeatedly for
the same thing, that is a missing component token, and the fix is to
add the token rather than to accept the workaround.

---

## 10. Interaction

### The press language

**A press shifts the surface colour. It does not dim the control.**

```
  rest      ->  action.<role>.bg
  pressed   ->  action.<role>.bgPressed
  disabled  ->  action.<role>.bgDisabled
```

The label, icon and border keep their own tokens throughout. Android
additionally gets a ripple, coloured from the same token set, because a
missing ripple reads as broken rather than as branded (section 3,
bucket 2).

The reason this is the language and not a blanket opacity: **a uniform
dim is not expressible in the token pipeline.** It is a blind transform
applied over the top, so the pressed state would not be a token, would
not be per-role, would not be configurable, and would bypass the
three-tier architecture that everything else depends on.
`bgPressed` is a semantic token and behaves like every other value in
the system.

**A press is always a colour change, never a dimming. Dimming means
disabled, and nothing else.** Two states that look alike are two states
the user cannot tell apart, and "unavailable" is the one they must read
instantly.

That holds even where there is no fill to move:

- `ghost` grows a tint on press (`action.<role>.bgSubtlePressed`) rather
  than fading its label.
- `link`, inside flowing text where a fill has nowhere to go, moves its
  label *away* from the background (`action.<role>.fgPressed`): darker
  on a light ground, lighter on a dark one. Same rule as the fills.

`opacity` therefore carries exactly one token, `disabled`.

### The mechanism

**`Pressable`, everywhere. Never `TouchableOpacity`.**

`Pressable` is a strict superset: it can express a uniform dim too, if
that is ever wanted for a specific component. `TouchableOpacity` cannot
express a colour shift, because it dims children along with the
container. The one thing `TouchableOpacity` gives away free is the
animated fade, and that is a handful of lines with `Animated`, which is
already a dependency of the motion layer.

Haptic feedback is additive on top of this, through the optional
adapter in section 5.1. The press language must read correctly with no
adapter present.

### Fixed regardless

- The state axis is `rest | pressed | focused | disabled`. No `hovered`.
- `disabled` is a value on that axis, not a separate branch, so a
  component can never have two competing disabled looks.
- Focus is not optional polish. Hardware keyboards, TV and
  accessibility navigation all depend on it.
- Motion goes through `Animated` or `LayoutAnimation` and reads its
  durations and curves from `motion` tokens. Never a hardcoded number.

---

## 11. Platform rules

- **Text must live inside `<Text>`.** A bare string in a `<View>` is a
  crash, not a layout quirk. Any component accepting a `ReactNode`
  where a string is likely wraps it.
- **Flex defaults are `column` and `stretch`**, not `row` and
  `flex-start`. Layout primitives are designed against RN's defaults.
- **No `position: fixed`, no portals.** Overlays use RN `Modal`. A
  component cannot render outside its parent hierarchy by any other
  means.
- **Inside a `Modal`, the responder negotiation only happens at
  touch-down.** A `PanResponder` that waits for the first move, the
  usual way to tell a press from a drag, is never asked: measured on
  iOS with a counter rendered on screen, `onStartShouldSet…` fires and
  `onMoveShouldSet…` fires zero times across a full drag. Grant at
  touch-down instead, in the bubble phase and not the capture one, so
  the deepest view under the finger still wins its own press and only
  the inert space between controls reaches the drag target. This is
  what `BottomSheet` does; anything else that drags inside an overlay
  has to do the same. **Outside a modal the move phase does run**, which
  is measured too: `SwipeableRow` claims on the first sideways move and
  nowhere else, because a row inside a scroll view that took every touch
  would swallow the taps and stop the list. The two components make
  opposite calls for the same reason, which is where the gesture is.
- **`KeyboardAvoidingView` measures itself in JavaScript, and inside a
  `Modal` it measures against the wrong window.** A form in a
  `BottomSheet` stayed exactly where it was, under the keyboard, with the
  avoiding view doing nothing at all. On iOS a scroll view's
  `automaticallyAdjustKeyboardInsets` asks UIKit for the inset instead,
  which needs no measurement and additionally scrolls the caret into
  view, which the avoiding view never did. `KeyboardAvoidingContainer`
  uses both: the avoiding view for the case with no scrolling, and the
  native inset for the case with one. Found on a device, with the
  software keyboard turned on, which is the only way to find it.
- **Android clips overflow.** A child cannot paint outside its parent's
  bounds. Designs relying on visible overflow need a different
  structure.
- **Elevation affects stacking on Android**, not just shadow. Two
  platforms, one token, two outputs.
- **Long lists use `FlatList` or `SectionList`**, never `.map()`.
- **Safe area is not our dependency.** Components needing insets take
  them as props.
- **Test on both platforms.** Ripple, elevation, overflow clipping and
  font metrics all differ. A component verified only on iOS is not
  verified.
- **Exactly one instance of `react-native` in the workspace.** pnpm keys
  a package by its resolved peers, so a single differing peer version
  creates a second copy, both end up in the bundle, and the JS-side view
  config registry of one does not know the native components registered
  by the other. It surfaces as `View config getter callback for
  component 'RCT…' must be a function (received undefined)`, which names
  neither the duplicate nor the peer that caused it. Found this way: the
  example app declared TypeScript `^6` while the library declared
  `~5.9`. Pin shared tooling in the workspace root's `pnpm.overrides`,
  and when a native component goes missing, check for duplicates before
  anything else.

### Verification

`@testing-library/react-native`. Interaction tests drive presses
through `fireEvent` and assert on the resolved style, never on
snapshots, which rot on every token change and teach nothing.

The example app is a **bare React Native CLI app**, not an Expo one,
per rule 2: bare passing implies Expo passing and the reverse does not.
There is no browser preview loop here, so a simulator run is the only
verification that means anything.

Its Metro config maps `@dashforge/rn` and its subpaths straight to
source. Metro does not honour TypeScript's custom export conditions, so
without that mapping the example runs the last build and a library edit
appears to change nothing, which reads as a broken fix rather than a
stale bundle.

**Look at it, not only at the suite.** Three defects reached a green
229-test run and were caught on screen in one glance: a duplicated
`react-native`, a `fullWidth={false}` that did nothing because React
Native stretches column children by default, and the stale-bundle
problem above. Tests assert what somebody thought to assert.

---

## 12. Accessibility

Paper sets the bar here and we match it. Correct by default, not by
configuration.

| Concern | RN API |
|---|---|
| role | `accessibilityRole` |
| label | `accessibilityLabel` |
| description | `accessibilityHint` |
| state | `accessibilityState={{ disabled, checked, selected, busy, expanded }}` |
| numeric value | `accessibilityValue` |
| hidden from AT | `accessibilityElementsHidden` (iOS) + `importantForAccessibility` (Android) |

Minimum touch target is 44x44 points. A control whose visual size is
smaller extends its hit area with `hitSlop` rather than growing. This
is a hard requirement.

---

## 13. Catalog

Derived from what a mobile application needs. Not from any web
catalog, and not by assuming a web component has a mobile equivalent.

**Foundation** — Text, Box, Stack, Divider, Icon slot, Spinner,
Skeleton, Avatar, Badge, Chip, Image, Card, Surface.

**Input** — Button, IconButton, TextField, Textarea, NumberField,
OTPField, Checkbox, Switch, RadioGroup, Select, Slider, SearchField,
SegmentedControl.

**Structure** — List and ListItem (the fundamental mobile layout unit,
in place of a table), SwipeableRow, Accordion, Tabs, EmptyState,
PullToRefresh, KeyboardAvoidingContainer.

Pull-to-refresh ships as a **hook**, `useRefreshControl`, and not as a
component. React Native makes the refresh control a *prop* of a scroll
view, so a wrapper could never reach the list it was wrapping, and a
component owning a scroll view of its own would have been a third scroll
container here and would have left `FlatList`, the shape a long list is
required to use, with nothing.

**Overlay** — BottomSheet (the primary mobile overlay pattern), Modal,
ActionSheet, Snackbar, ConfirmDialog, Popover.

**Navigation surfaces, presentational only** — Header, TabBar, FAB.
These render; they do not navigate. Navigation belongs to
react-navigation and we do not reimplement a router.

**Date and time** — a field plus a headless controller, delegating to
the platform picker for single date and time. DateRangePicker is the
exception and ships a calendar on `calendar-core`.

### Deliberately not shipped

- **Data grid.** Column resize, reorder and virtualisation assume a
  mouse and a large canvas. On a phone it is the wrong component. List
  covers the real need.
- **App shell / navigation container.** react-navigation's job.
- **Tooltip.** Requires hover. The mobile equivalents are a Popover on
  long press or a helper line, both of which we ship.
- **Breadcrumbs.** Meaningless in a stack navigator.
- **Grid, Container.** Mobile is single column. Stack covers it.
- **Link.** Navigation, plus `Linking` for external URLs.
- **VisuallyHidden.** Replaced by the accessibility props above.

`SCOPE.md` in the package records what ships, what does not, and why.

---

## 14. File conventions

```
components/Button/
  Button.tsx           the component
  button.types.ts      props and exported types, JSDoc on every field
  button.variants.ts   the sv() recipe
  Button.test.tsx      behaviour tests
```

- One component per directory, `PascalCase`.
- Shared internals in `components/_shared/`.
- Headless logic in a `use<Thing>.ts` beside its consumer, or in
  `_shared/` when reused.
- Barrel exports only from `src/index.ts` and the two subpath entry
  points. No intermediate barrels.
- **Relative imports carry no file extension.** `./palette`, never
  `./palette.js`. The extension suffix is a Node ESM and web-bundler
  convention; Metro and the Jest resolver look for a literal file of
  that name and fail. Verified, not assumed: the first `.js`-suffixed
  import written in this package broke the test run.

Separating the recipe from the component is what keeps rule 5 of
section 4 enforceable: a reviewer can read one file and see every style
the component can produce.

---

## 15. Decisions

Made deliberately, recorded with the reasoning so they are not
relitigated by whoever writes the next component. Any of them is
reversible, but reversing one means amending this document first, not
deviating from it in a single component.

### Visual language

**Surface: flat fills and borders. Elevation only for what genuinely
floats** (`Modal`, `BottomSheet`, `Menu`, `Snackbar`, `FAB`).

Three reasons. It is the only language expressible with what RN gives
for free, with no gradient and no blur, so it never collides with rule
3. Elevation on Android changes stacking, not just shadow, and
interacts badly with clipping. And shadow is the one token that is
different by construction on the two platforms, so the less it is used,
the less divergence there is to chase.

**Radius: `control` 8, `surface` 12, `pill` 9999.**

Controls, fields and chips at 8, which is where a control stops looking
like a port from the web without becoming ingratiating. Cards, sheets
and modals at 12. Avatars and badges round. The container softer than
the content it holds is the hierarchy the eye expects.

**Control heights: 36 / 44 / 52**, with `sm` reaching the 44pt minimum
touch target through `hitSlop` rather than growing visually.

**Density: comfortable by default**, compact available as an option.

**Typography: the platform system stack** (SF on iOS, Roboto on
Android), with a composite scale of `display / title / subtitle / body
/ label / caption / mono`. A custom family stays reachable as a token
the app has already loaded.

### Interaction

**Press shifts colour, it does not dim. `Pressable` everywhere.** Full
reasoning in section 10, and it is the reasoning that matters: a
blanket opacity cannot be a token, so it cannot be configured, so it
does not belong in this architecture.

### Platform

**Minimum React Native 0.78** (React 19), so `ref` is an ordinary prop
and no component carries `forwardRef`. Development and verification
happen against current RN, not against the floor.

The floor is set forward rather than backward on purpose: there are no
legacy consumers to protect, and the first consumer is the author. The
cost of a floor set too low is paid on every component, forever; the
cost of one set too high is paid once, by whoever has to upgrade.

### Still to be worked out

Not blockers, and not architecture. These are the next pieces of work.

1. **The palette.** Which concrete hues back each semantic role. The
   structure is decided, the values are not.
2. **Component anatomy.** For each component, the list of its parts.
   This is the expensive decision, because appearance reconfigures and
   anatomy does not: a wrong colour is a `patchTheme`, a missing slot
   is a minor version and a forked component downstream. Do this before
   writing components, not while writing them.
3. **The layout prop list** for `Box` and `Stack`. Section 9 requires it
   to be short, closed and reviewed. It has not been enumerated yet.
