# @dashforge/rn

Token-first React Native UI library. Props, not styles.

Part of [Dashforge](https://github.com/kensaadi/dashforge), sharing its
reactive engine, form bridge and RBAC layer with the web renderers,
and nothing else.

> **Status:** 0.0.1, the first published cut. The component surface is
> complete and covered by tests, but the API is still free to move
> before 0.1.0.

## What it is

A React Native library where every visual decision is a typed prop
resolved against design tokens, with no build step, no native modules,
and no Expo requirement.

- **Props, not styles.** You describe intent (`variant`, `color`,
  `size`), not appearance.
- **Zero configuration.** Install it and nothing else. No Metro config,
  no Babel preset, no prebuild, no dev client.
- **Three-tier tokens.** Primitive to semantic to component, so a
  rebrand is a remapping and dark mode is one tier swapping.
- **RBAC-aware and form-integrated**, through the shared Dashforge core.

## Install

```sh
pnpm add @dashforge/rn
```

The four shared core packages are peer dependencies, so they are
installed alongside:

```sh
pnpm add @dashforge/ui-core @dashforge/forms @dashforge/rbac @dashforge/calendar-core
```

Requires React 19.2.3 or newer and React Native 0.78 or newer.

## Usage

Wrap the app once. The provider renders no view of its own: it wires
the theme store to the platform, and everything it takes is optional.

```tsx
import { DashforgeNativeProvider } from '@dashforge/rn/theme';

export default function App() {
  return (
    <DashforgeNativeProvider>
      <Screen />
    </DashforgeNativeProvider>
  );
}
```

Then the components read the theme themselves.

```tsx
import { Button, Card, TextField } from '@dashforge/rn';

function Screen() {
  const [q, setQ] = useState('');

  return (
    <Card>
      <TextField label="Search" value={q} onChangeText={setQ} fullWidth />
      <Button size="sm" color="secondary" variant="outline" onPress={submit}>
        Send
      </Button>
    </Card>
  );
}
```

Without a `storage` adapter the chosen mode does not survive a
relaunch, and without a `datePicker` adapter a `DateField` falls back
to the calendar this library draws itself. Both are valid
configurations, and both are a prop on the provider.

## Entry points

| Import | What it holds |
| --- | --- |
| `@dashforge/rn` | The components and the hooks. |
| `@dashforge/rn/theme` | The theme runtime and the styling API: `defineTheme`, `sv`, `createRecipe`, `useTheme`, the provider. |
| `@dashforge/rn/tokens` | The token tiers and the palette builder. |

## What is in it

Form fields: `TextField`, `Textarea`, `NumberField`, `SearchField`,
`DateField`, `DateRangeField`, `OTPField`, `Slider`, `Checkbox`,
`Switch`, `RadioGroup`, `Select`.

Layout and surfaces: `Surface`, `SurfaceViewport`, `Stack`, `Card`,
`Divider`, `KeyboardAvoidingContainer`, `Header`, `TabBar`, `FAB`.

Content: `Typography`, `Image`, `Avatar`, `Badge`, `Chip`, `Spinner`,
`Skeleton`, `EmptyState`, `List`, `ListItem`.

Overlays and navigation: `Modal`, `BottomSheet`, `Popover`, `Snackbar`,
`Tabs`, `Accordion`, `SegmentedControl`, `SwipeableRow`,
`createDialogs`, `createActionSheet`.

Hooks: `useAccessState`, `useVisibility`, `useKeyboardHeight`,
`useRefreshControl`.

## Documentation

[`ARCHITECTURE.md`](https://github.com/kensaadi/dashforge-rn/blob/main/ARCHITECTURE.md)
is normative: it is the reference for how this package is built and
why, and when an implementation choice contradicts it, the document
wins or the document gets amended first. It lives in the repository
rather than in the package.

## Licence

MIT.
