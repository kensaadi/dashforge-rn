# How it works

What actually happens underneath, and how to use it correctly.

This is the source material for the public documentation. It is not
`ARCHITECTURE.md`: that one is normative and says how the library *must*
be built, and reading it does not tell you what a value on screen came
from. This one explains the machinery and the correct way to drive it,
with the measurements that justify each decision, so the published docs
can be written from evidence rather than from memory.

Living document. Sections land as the implementation does.

---

## 1. The colour system

### 1.1 The problem it solves

Colour ramps are normally authored in HSL or HSB, because that is what
design tools offer. Both are convenient and neither is perceptual: their
"lightness" is a number about the colour model, not about how light the
colour looks.

The consequence is measurable. Take five hues, put each at the same HSL
lightness, and ask how well white reads on them:

| role | HSL 50%-ish step | white on it |
|---|---|---|
| primary (blue) | `#3c5ddf` | 5.49 |
| danger (red) | `#df413c` | 4.23 |
| info (cyan) | `#35aee6` | 2.52 |
| warning (amber) | `#f19e2a` | 2.17 |
| success (green) | `#4ccf92` | 1.97 |

Same step, contrast ranging from 5.5 to 2.0. A design system built on
that cannot promise anything, so it ends up compensating: hand-tuning
each hue, or searching the ramp at runtime for a step that happens to
work. We did both, briefly, and both are symptoms.

### 1.2 What replaced it

The ramps are generated in **CIE LCh at fixed L\* tones**. L\* is
perceptual lightness. It is also the axis Material 3 calls "tone", and
Material uses it for the same reason: on that axis, contrast becomes
arithmetic.

> two tones **40 apart** contrast at least **3:1**
> two tones **50 apart** contrast at least **4.5:1**

Whatever the hue. Measured on our own ramps, the pair "white on step
600" lands at 4.63, 4.63, 4.64, 4.65 and 4.65 across the five chromatic
roles. Not "all pass" but "all land in the same place", which is the
difference between a guarantee and a coincidence.

### 1.3 The step contract

Every step is a tone with a job. This table is the contract; the tests
assert it rather than trusting it.

| step | tone | job |
|---|---|---|
| `50` | 97 | page background, palest tint |
| `100` | 92 | tinted background for a feedback surface |
| `200` | 85 | tinted border, subtle fill |
| `300` | 76 | border; label on a dark page |
| `400` | 65 | **fill for a dark-label role** |
| `500` | 57 | emphasis |
| `600` | 49 | **fill for a light-label role** |
| `700` | 41 | label on a light page |
| `800` | 32 | text on a tinted background |
| `900` | 23 | **label on a dark-label fill** |
| `950` | 13 | deepest text |

The guaranteed pairings that follow:

| pairing | tone delta | measured |
|---|---|---|
| white on `600` | 51 | 4.63 – 4.65 |
| `950` on `400` | 52 | 5.93 – 5.98 |
| `700` on a `50` page | 56 | 4.87 – 4.90 |
| `400` on a `950` page | 52 | ≥ 4.5 |
| `800` on a `100` tint | 60 | 6.79 – 6.84 |

`neutral` runs a wider tone map of its own (98 down to 8). Every surface
in the product lives on it, and a dark page belongs at T8 where a
chromatic hue has no reason to go past T13.

### 1.4 Light labels and dark labels

Two systems solve "this hue cannot carry white" in opposite ways, and
both are defensible:

- **Material** puts every fill at the same tone. Uniform, and it turns an
  amber into an ochre and a green into a bottle green.
- **Apple** keeps `systemOrange` and `systemYellow` vivid and darkens the
  label instead.

**We follow Apple.** Roles named in `darkLabelRoles` (by default
`success` and `warning`) take their fill from step `400`, where the hue
is still itself, and pair it with the `950` label. Everything else takes
`600` with white.

It is a declaration in the theme, not a runtime rescue, and it is
overridable:

```ts
makeSemanticLight(palette, { darkLabelRoles: [] });      // white everywhere
makeSemanticLight(palette, { darkLabelRoles: ['info'] }); // and info too
```

Either way the contract holds, because both `600`-with-white and
`400`-with-`950` are 50-plus tone pairs.

### 1.5 Press feedback

One rule, no exceptions: **a press moves the fill away from its label.**

- White label → the fill deepens (`600` to `700`).
- Dark label → the fill lightens (`400` to `300`).
- Neutral fill in dark mode → lightens, because deepening it on a dark
  page walks it into the page instead of reading as pressed.

The contrast after a press is therefore always better than before it,
which is not true of the obvious implementation.

**A press is never a dimming.** Dimming means disabled and nothing else,
because two states that look alike are two states a user cannot tell
apart, and "unavailable" is the one they must read instantly. That holds
even where there is no fill to move: `ghost` grows a tint, and `link`
moves its label further from the page.

### 1.6 Increase Contrast

The semantic tier swaps on three axes, not two: light, dark, and the
platform's Increase Contrast setting. Both operating systems expose it
and both adapt their own colours to it.

```ts
makeSemanticLight(palette, { highContrast: true });
```

It deepens text, strengthens borders and **makes separators opaque**. A
translucent hairline is the first thing to disappear for somebody who
has asked for more edge.

### 1.7 How to use it correctly

**The safe path is a seed, not a ramp.**

```ts
import { makePalette } from '@dashforge/rn/tokens';

const palette = makePalette({ primary: '#7c3aed' });
```

One hex. Only its **hue and chroma** are used; its lightness is
discarded on purpose, because where a brand colour happens to sit is not
where the ramp's steps belong. Honouring it is precisely how a scale
ends up with a different real lightness per hue.

The feedback roles are left alone unless you ask, because they are
meanings rather than brand. A product that recolours its error state to
match its logo has stopped communicating.

```ts
makePalette({ primary: '#7c3aed', danger: '#b3261e' });  // house red
makePalette({ primary: '#7c3aed', neutral: '#64748b' }); // your own grey
```

**Hand-authored ramps are accepted and checked, not corrected.**
`defineTheme` runs `checkPaletteContract` under `__DEV__` and warns with
the numbers:

```
[@dashforge/rn] This palette does not meet the contrast contract (3 pairings):
  primary: white on 600 (a light-label fill) measured 3.55, needs 4.5
  ...
```

Silent in production: a contrast problem is worth interrupting a
developer over and never worth interrupting a user over.

**What not to do.** Do not build ramps in a picker set to HSL or HSB and
paste them in. It is the single most common way to land in that warning,
and it is not a small miss: of the four alternative palettes this
project's own playground originally shipped, three failed white-on-600,
at 3.55, 3.80 and 2.29. They rendered perfectly happily on screen.

---

## 2. The variant engine

### 2.1 Why it is not a merge at render time

NativeBase, the most popular props-driven React Native library, was
deprecated by its own authors: its styling engine resolved everything at
runtime and ended up slower than plain React Native. Its successor
bought its way out with a Babel plugin.

This library refuses a build step, so the only route left is to resolve
once and look up thereafter.

### 2.2 What actually happens

`sv()` and `svSlots()` return a resolver. On the first call for a given
combination of variants it merges base, then each axis in declaration
order, then every matching compound, registers the result as a single
`StyleSheet` entry, and caches it under a key built from the declared
axis order.

Every call after that is a `Map.get`.

- Compilation is **lazy, not exhaustive**. `Button` alone expresses
  4 variants x 5 roles x 3 sizes x 3 states x 2 widths. An application
  touches a handful, and paying for all of them at startup is paying for
  nothing.
- The same props return **the identical object**, so `React.memo`
  downstream keeps working. There is a test for that specifically.
- The key is built from the recipe's declared axis order, so callers
  passing the same values in a different order hit the same entry, and
  an explicitly-passed default hits the same entry as an omission.
- The output is **one pre-merged style, not an array**. The array a
  component finally hands React Native is `[resolved, sx]`: two entries,
  so the override contract stays intact while the variant work is done.

### 2.3 Recipes are bound to tokens, not to modules

A recipe cannot be a module constant, because its values come from the
theme and the theme is swappable at runtime. `createRecipe` runs the
factory once per token object and caches against that object's identity
in a `WeakMap`, so a replaced theme does not pin its resolvers forever.

```ts
export const buttonRecipe: (t: ButtonTokens) => (p?: Sel) => Slots =
  createRecipe((t: ButtonTokens) => svSlots({ /* ... */ }));
```

**Recipes carry an explicit type annotation, always.** Without one `tsc`
infers a type reaching into React Native's generated internals and
refuses to emit a portable declaration (TS2742).

---

## 3. The theme runtime

### 3.1 Three tiers, one direction

```
PRIMITIVE  ->  SEMANTIC  ->  COMPONENT  ->  the rendered style
raw ramps      meaning       usage
```

A component's recipe reads **its own component tokens and nothing
above them**. Not the palette, not the semantic layer, not literals.
That is what makes the configuration complete: if every style a
component can produce traces to a component token, every style it can
produce is reachable from the theme.

### 3.2 What a mode swap actually is

The store holds **both themes and the active mode**, not one active
theme, so `setMode` is a pointer move rather than a rebuild. It is also
what makes the claim testable: there is an assertion that
`themes.light.palette` and `themes.dark.palette` are *the same object*.
If that ever stops holding, dark mode has begun leaking out of tier 2.

Tiers 2 and 3 are deep-cloned per theme by `defineTheme`. Without that,
a `patchTheme(..., 'dark')` reaches into light, because the shipped
semantic layers share their non-colour tokens by reference and anyone
composing themes with the spread operator hits the same trap.

### 3.3 Overriding

```ts
patchTheme({ semantic: { action: { primary: { bg: '#…' } } } }, 'dark');
patchTheme({ components: { Button: { tokens: { radius: 0 } } } });
```

`target` defaults to `'both'` because most patches are structural: a
radius, a spacing step, a component default. Pass `'light'`, `'dark'` or
`'active'` for anything genuinely mode-specific, which in practice means
colours.

Component tokens are **merged over the shipped defaults**, so overriding
one value does not require restating the other twenty.

### 3.4 `useTheme()`

Returns the resolved theme: concrete values, no path strings, no lookup
function to learn. Backed by a valtio snapshot, so reads are granular
and a component that touches `semantic.surface.raised` does not
re-render when the type scale changes.

Application code should read the **semantic** tier. Primitives are
reachable and are the wrong level, exactly as they are for our own
components.

---

## 4. Typography

Two React Native constraints shape the type tokens, and both are
invisible on the web.

**Line height is a ratio, not a pixel value.** React Native scales
`fontSize` when the reader raises the system text size and leaves
`lineHeight` untouched, so a stored absolute 24 against a doubled 16pt
body produces overlapping lines: broken precisely for the person who
needed the setting. `resolveTypeStyle` multiplies the ratio by
`PixelRatio.getFontScale()`.

**Only three weights exist: 400, 500, 700.** Roboto ships Regular,
Medium and Bold and has **no 600**; SF on iOS does. A `'600'` token
would render semibold on one platform and something else on the other:
one token, two appearances.

Reading text (`body`, `bodySmall`) carries no `maxFontSizeMultiplier`.
Capping body text caps the reader. Controls size with `minHeight` and
grow rather than clipping; the cap on `label` is a safety net for
extreme settings, not the mechanism.

---

## 5. `access` and `visibleWhen`

The two props every component carries, and the reason this is a
Dashforge library rather than another React Native component kit.

### 5.1 What they replace

Without them, permission and form-driven visibility are wrapping
concerns:

```tsx
{can('invoice', 'delete') && <Button onPress={remove}>Elimina</Button>}
{form.watch('type') === 'business' && <TextField name="vat" />}
```

Ten of those in a screen is ten places to get it wrong, and the guard
sits at the call site of the wrapper rather than on the thing being
guarded. Declared on the component instead:

```tsx
<Button access={{ resource: 'invoice', action: 'delete' }} onPress={remove}>
  Elimina
</Button>
<TextField name="vat" visibleWhen={(e) => e.getValue('type') === 'business'} />
```

### 5.2 `access`

Resolved against the ambient `<RbacProvider>` through
`@dashforge/rbac`, which is the same engine the MUI and Tailwind
renderers use. The requirement carries its own `onUnauthorized`:

| value | effect |
|---|---|
| `'hide'` (default) | the component does not render |
| `'disable'` | rendered, inert |
| `'readonly'` | rendered, non-editable |

**That decision belongs to the requirement, not to the component.** A
component consumes the resolved state and never overrides it, which is
what keeps one rule producing the same outcome everywhere it is applied.

**With no provider mounted, access is granted** and a warning is logged
under `__DEV__`. Failing open is the core's choice and the safer one: a
silent deny is a regression found late, while an over-permissive
development build is visible immediately and a production app that means
to enforce permissions mounts the provider.

### 5.3 A component acts only on the states it has

`AccessState` carries `visible`, `disabled` and `readonly`. A component
honours the ones that mean something for it and ignores the rest.

- `Button` has no read-only state, so `'readonly'` resolves to disabled.
  Same mapping as the other two renderers.
- `Typography` has no interactive state at all, so `'disable'` and
  `'readonly'` change nothing. It renders or it does not.

The second case is worth being explicit about: an `access` requirement
with `onUnauthorized: 'readonly'` on a piece of text is the wrong
requirement for that component, and nothing here tries to guess what it
was supposed to mean. Inventing a treatment would hide the mistake
somewhere it is hard to find. The library's job is to provide the tool.

### 5.4 `visibleWhen`

A predicate over form state, evaluated against the ambient `<DashForm>`
engine and re-evaluated as that state changes. Outside a form there is
no engine and the predicate is never called, which is why a component
using it works standalone with nothing extra at the call site.

`access` and `visibleWhen` are independent and either hides on its own.
They answer different questions: whether this person may see it, and
whether the form is in a state where it applies.

### 5.5 Cost when absent

Nothing. Both hooks run unconditionally (they are hooks) and both return
immediately without a provider or a form. No context, no subscription,
no re-render.

---

## 6. `Surface`, the reactive region

**Partly shipped.** The matcher and the transition exist and are covered
by tests. The commit policy (6.6, 6.7), which decides *when* an answer is
applied rather than what it is, has not been written yet, so those two
sections describe what the region will do rather than what it does today.
The stagger in 6.8 is not written either, and is marked where it appears.

### 6.1 The problem it exists for

A mobile screen is a fixed budget of space, and the navigation model
spends it one question at a time: home, selector, list, detail,
sub-detail. Each screen serves one purpose and then sits still. The
lifecycle is always the same: call the API, map the object, iterate,
mount. After the mount the screen is finished, and any further knowledge
the application acquires costs the user a tap to go and find.

`Surface` is a region that can spend the same space more than once. A
place that already exists in the layout, whose content is replaced when
asynchronous business knowledge arrives that makes better use of it.

The canonical case is not a notification. A returning customer opens the
home screen and sees the generic best sellers, because that is all the
app knows in the first frame. A request is already in flight computing
what this person is actually likely to want. Two seconds later the
answer lands, the generic card dissolves, and a personalised one takes
its place. The user navigated nowhere.

The same machinery covers a second shape that is arguably the more
common one: several services with different latencies, and a screen that
composes itself as each answer arrives rather than in a single mount.
That case, and the discipline that keeps it readable, is section 6.9.

The nearest thing in the wild is the ride screen of a hailing app: one
screen that carries five business phases without a single tap. It is
written by hand every time, in every app that does it, because there is
no primitive for it.

### 6.2 The admission test

**Use a `Surface` when it saves the user a click. Not otherwise.**

The question to ask before adding one: without this, would the user have
had to navigate, search, or tap to reach this information? If yes, the
region has earned the right to change. If no, it is decoration, and
decoration that moves on its own is noise.

Personalised recommendations replacing generic ones pass: you would have
had to go looking. A promotional carousel does not, and that is exactly
what this feature degenerates into when the test is not applied.

The library cannot judge content and does not try. What it does is make
the space *earned* rather than always on: absence is the default, and
filling the region requires a condition that is actually true.

### 6.3 Shape

```tsx
<Surface>
  <Surface.Case when={recs.ready}>
    <PersonalisedCard items={recs.items} />
  </Surface.Case>

  <Surface.Case when={topSellers.length > 0}>
    <TopSellersCard items={topSellers} />
  </Surface.Case>

  <Surface.Fallback>
    <SkeletonCard />
  </Surface.Fallback>
</Surface>
```

Three properties do all the work.

**Source order is the priority.** No numbers, no scheduler. You read the
file downwards and you know what wins. It is the simplest priority model
that exists and the only one that does not degenerate.

**First match wins.** Two cases being true at once is not handled, it is
unambiguous by construction.

**`Fallback` answers "and if none of them".** The silent hole, which is
how these things fail in production, is not expressible.

`when` is a boolean, not a predicate over an injected store. The cases
are written inside the consumer's own render, where their state is
already in scope, so a predicate would only add a layer to pass it back
in. This also means `Surface` has no opinion about state management: any
store that causes a re-render works, and there is nothing to adapt.

Case children are elements, not rendered trees. A case that does not win
never calls its component, so the branches cost nothing until selected.

### 6.4 The fallback is optional, and that is the switch

Whether the region holds its place is not a mode to configure. It falls
out of whether a fallback was written.

| authored | behaviour when nothing matches |
|---|---|
| no `Fallback` | renders nothing, occupies no height, siblings close up |
| with `Fallback` | the region keeps its place and shows that branch |

Both are first-class. The fallback is not the poor case: it is real
content, well represented, that steps aside when something arrives that
deserves the space more.

Whether the initial content comes back afterwards is not a question the
component answers. It is a pure function of state, so if the condition
that made it win becomes true again, it wins again. No memory of what
was already shown, no dismissal stack, nothing to reset.

### 6.5 Boundaries

Three things `Surface` is not, each of which it would grow into if left
unguarded.

**It is not a list.** A view with three cards where a fourth arrives is
a collection that grew, not a place that changed its mind. `Surface` is
one region whose content is replaced over time. Blur that line and in
six months it renders N children and we have written a bad `FlatList`.

**It is not an overlay.** An urgent interruption that takes an area of
the screen wherever you happen to be looking is a bottom sheet, and a
bottom sheet does its own job. If a `Surface` were given a `position`
prop to cover that case it would own layout within a year.

**It never places anything.** The region is where it was written. Content
that inserts itself wherever it likes means the page changes shape in
ways nobody designed. The whole point is that the places are decided up
front and stable: what changes is what they say, not where they are.

### 6.6 When the change is allowed to land

The rule that separates natural from invasive is geometric, not
aesthetic:

> Content that takes space which was idle is a gift. Content that takes
> space the user was using, or that pushes down what they are reading, is
> an intrusion.

That is why apps that "animate" so often feel hostile. It is not the
animation, it is that the line moved out from under the finger.

Three situations, three answers, no ambiguous case:

| situation | what happens |
|---|---|
| a scroll is in flight | nothing changes anywhere, the commit queues |
| settled, region below the viewport | applies immediately, without transition |
| settled, region in or above the viewport | applies with the transition; growth above the fold anchors the scroll offset |

**During an active scroll everything freezes.** This is not about
visibility. Any height change during momentum moves the landing point:
the user flicks aiming at something and arrives somewhere else.

**Below the fold is the best moment, not a wasted one.** Filling a region
the user has not reached yet moves nothing visible, and when they scroll
down the content is simply there. Waiting until it enters view produces
the opposite: content materialising as you arrive at it.

**Above the fold is the worst case**, worse than in view, because there
at least you see what happened. Either the offset is anchored or the
commit waits.

The library never scrolls the user. Content appearing above the current
position is compensated so that what is being read stays put
(`maintainVisibleContentPosition` on the scroll view; long-standing on
iOS, later on Android, so the supported version has to be verified). If
something worth going back for landed above, the correct affordance is a
tappable marker at the top, and the jump is the user's decision.

### 6.7 How much a region is allowed to interrupt

The commit policy is not a detail about animation. It encodes how much
the content has the right to interrupt, and the editorial rule for
choosing is one line:

> Interrupting is legitimate when *not* seeing it costs the user
> something.

An incoming ride request enters now: delaying it for the driver's scroll
costs them money. A list of product offers never has that right, because
missing it costs nothing.

| `commit` | lands |
|---|---|
| `'immediate'` | as soon as the condition is true, scroll or no scroll |
| `'settled'` *(default)* | once the user has been still for a moment |
| `'unattended'` | only while the region is not being looked at |

The default is `'settled'`, because half a second of delay is a smaller
cost than tearing content away.

**Implementation constraint, stated because it is real.** React Native
has no ambient notion of "the user is scrolling", and a region cannot
know where it sits relative to a viewport it was not told about. The
quiet policies therefore require the scroll container to be wired:

```tsx
<SurfaceViewport>
  <ScrollView>…</ScrollView>
</SurfaceViewport>
```

Without it, `'settled'` and `'unattended'` have nothing to wait for and
degrade to `'immediate'`, with a `__DEV__` warning. This is a limit of
the platform, not something the component can paper over.

### 6.8 The transition

**A dissolve, not a slide.** A slide says something arrived from
somewhere else, which is false: nothing travelled, the region changed
its mind. The dissolve is the only motion that describes what actually
happened.

- Cross-fade, decelerating, on the motion tokens rather than on numbers
  of its own: the outgoing branch leaves over `motion.standard` (200ms)
  and the incoming arrives over `motion.deliberate` (320ms).
- The incoming being the slower of the two is what produces the overlap,
  so the outgoing is long gone before the new content has settled and
  there is never a frame showing neither.
- `deliberate` rather than `standard` for the entry because a refinement
  is a real event and wants to be read. `standard` is the speed of a
  control reacting to a touch, and at that pace the change registers as
  a flicker rather than as something having arrived.
- Incoming content scales 0.98 to 1, which reads as settling rather than
  appearing.
- No rotation, no flip. Showy, ages badly, and this has to be able to
  happen twenty times in a session without being noticed as an effect.

**Height is the tedious part.** If the new branch is taller, the
container has to grow, and height is not free to animate in React
Native. The incoming branch is laid out at its natural height while the
container is still clipped to the old one, so its `onLayout` reports the
target and the container is animated to it. One frame of measurement, no
extra dependency, and it avoids the hard jump that would undo everything
else.

Height cannot go on the native driver, which is why it is a value of its
own on a view of its own: the container animates height on the JS thread
while opacity and scale stay native on the content inside it.

**The end of the change hangs off the fade, not off the height.** The
fade always runs; the height animation waits for a measurement that a
zero-sized branch, or one that never lays out, would never produce.
Tying the end of a change to the thing that always happens is what keeps
a region from being stuck half way.

**Adjacent surfaces stagger.** *Not written yet.* Two regions committing
in the same tick are not perceived as two changes, they are perceived as
the app blinking. A delay of about 100ms on the second makes them two
legible events. It will be automatic and have no API: surfaces
committing in the same tick ordered by a module-level scheduler.

**Reduce Motion is honoured.** With the system setting on, no fade and no
scale: the swap is instant. The content still changes, only the manner
does. This is not a refinement; for some people those transitions are
physically unpleasant. The platform answer is asynchronous, so the value
starts `false` and corrects itself on the first tick, which is the right
way round: it is read before anything has had reason to move.

### 6.9 Coordination between surfaces

Regions on independent conditions need no ceremony. The case worth
working through is the one where they are not independent: several
backend services with different latencies, and a screen that composes
itself as each answer lands.

A recommendation algorithm takes a couple of seconds to decide what this
customer is likely to want. As soon as it answers, a second service
starts a deeper search across those same products to produce detailed
options, and takes longer still. Meanwhile a second region has space to
fill and something reasonable to say.

That is not one region swapping content, it is **progressive fill**, and
it is the main use of this primitive rather than an edge of it. The
screen stops being a single mount and becomes a composition that arrives
in stages.

The temptation is to write the second region as "recommendations ready
and details not ready yet". Two mechanisms remove almost all of that
before it is written.

**Ordering already expresses the negation.**

```tsx
<Surface>
  <Surface.Case when={details.ready}>
    <DetailedOptions items={details.items} />
  </Surface.Case>
  <Surface.Case when={details.pending}>
    <OfferOfTheMonth />
  </Surface.Case>
</Surface>
```

First match wins, so `&& !details.ready` is never written: the order says
it. Half of the coupling disappears at the point of authoring.

**Per-request status removes the cross-reference.** The second service
only starts once the first has answered, so `details.pending` already
implies that recommendations arrived: a request that has not started is
not pending. The dependency lives in the call chain, which is where it is
true, and the view does not restate it.

Give every asynchronous operation its own status rather than a bare
boolean and the two regions never refer to each other while staying
perfectly coordinated. They remain independent and individually
deterministic; the interleaving exists in reality, not in the code.

What survives both is the genuinely coupled case, and it is rare. The
tripwire tells the two apart, and is recognisable while typing:

> If you find yourself writing the same condition in two surfaces, that
> condition wants a name.

Written twice, the relationship between the two regions exists in your
head and nowhere in the code. Nobody can read a screen and know what it
does, because the answer is spread across two files and has to be
reassembled from memory. That is the giant conditional we set out to
avoid, merely cut into pieces.

The discipline is to derive it once, upstream, and give it a name. It
usually collapses to a single value describing what the screen is
currently doing, and each surface compares against that. The screen
becomes readable and, more importantly, testable: the possible states
are enumerable, so they can all be written down and checked. Interwoven
conditions are not, and you find out in production.

**This maps state to view. It does not manage state.** Sequencing inside
`when` is a state machine written sideways in JSX; the sequence belongs
in the store, and the surface renders its output.

Nothing about that boundary assumes a human wrote the rules. The signal
is consumer state, so whatever computes it, a hand-written rule or a
model deciding that now is the moment for this content, is invisible from
here. That door is open because the logic was kept out of the component,
not because anything was added for it.

### 6.10 Not inside forms

`visibleWhen` governs fields. `Surface` governs content. Neither does the
other's job, and the incompatibility is structural rather than stylistic.

A surface assumes unmounting is free, because its state lives upstream.
In a form, unmounting a field destroys what the user typed and raises
the question of whether that value stays in the payload. That question is
already answered by `visibleWhen` and the field registration lifecycle
(section 5).

Timing points the other way too. The commit policy defers change to a
quiet moment; a form needs the opposite, because typing X must reveal Y
now, while the user is looking at it. A field that appears late, after
they have moved on, is a validation problem.

Documented as a rule, not enforced at runtime: a screen containing a form
can perfectly well have a surface beside it, and the component is not
going to guess where it has been mounted.

### 6.11 What the library deliberately does not do

**Screen-level budgeting.** Three regions and five things worth saying:
who chooses? Not us. If only one should speak, the store computes which,
and each surface stays independently deterministic. The moment the
library starts choosing between surfaces, it has become a scheduler, and
there is no way back from that.

**Computing where content should go.** Attractive and wrong. The strength
of the model is that the places are fixed and the content is not.

### 6.12 Props

Both `access` and `visibleWhen` are carried, as on every component. On a
surface `visibleWhen` is legal but rare, given 6.10.

| prop | default | meaning |
|---|---|---|
| `transition` | `'fade'` | `'fade'` or `'none'` (6.8) |
| `sx` | | style override on the region, applied last |
| `access` | | permission requirement (section 5) |
| `visibleWhen` | | form predicate (section 5) |

`Surface.Case` takes `when: boolean`. `Surface.Fallback` takes nothing.

`commit` arrives with the behaviour it controls rather than as a prop
that accepts a value and ignores it: one of `'immediate'`, `'settled'`
and `'unattended'` (6.7). It is additive, so nothing written today has to
change to pick it up.

`sx` is a plain style rather than a slot map, because the region has one
styleable element. Compound components like `TextField` take a map.

**Open, to settle during implementation:** whether a commit callback is
worth exposing for analytics, since knowing which branch won and when is
the measurement that tells you if the region earned its place.

---

## 7. Still to write

- Component anatomy, per component, as each lands.
- The `sx` contract with worked examples.
- RBAC and form-bridge integration, once components consume them.
- The install recipe, including the `lucide-react-native` pairing and
  the note that `PlatformColor` is the escape hatch for an app that
  deliberately wants the platform look.
