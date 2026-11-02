# Changelog

All notable changes to `@dashforge/rn` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.0.1] - 2026-11-02

First published version. The surface is complete and tested, the API is
still free to move before 0.1.0.

### Added

- **Theme runtime** at `@dashforge/rn/theme`: `DashforgeNativeProvider`,
  `defineTheme`, `sv`, `svSlots`, `createRecipe`, `useTheme`,
  `useThemeMode`, `useComponentTokens`, `useComponentDefaults`, and the
  store functions (`setMode`, `setTheme`, `toggleMode`, `patchTheme`,
  `getTheme`). Light and dark ship with the package; the mode follows
  the system, a controlled prop, or a persisted value, in that order of
  precedence.
- **Three-tier tokens** at `@dashforge/rn/tokens`: primitive, semantic
  and component, with the LCH palette builder and the contrast helpers.
- **Form fields**: `TextField`, `Textarea`, `NumberField`,
  `SearchField`, `DateField`, `DateRangeField`, `OTPField`, `Slider`,
  `Checkbox`, `Switch`, `RadioGroup`, `Select`. Each one works both
  standalone as a controlled input and bound to `@dashforge/forms` by
  `name`.
- **Layout and surfaces**: `Surface`, `SurfaceViewport`, `Stack`,
  `Card`, `Divider`, `KeyboardAvoidingContainer`, `Header`, `TabBar`,
  `FAB`.
- **Content**: `Typography`, `Image`, `Avatar`, `Badge`, `Chip`,
  `Spinner`, `Skeleton`, `EmptyState`, `List`, `ListItem`.
- **Overlays and navigation**: `Modal`, `BottomSheet`, `Popover`,
  `Snackbar`, `Tabs`, `Accordion`, `SegmentedControl`, `SwipeableRow`,
  `createDialogs`, `createActionSheet`.
- **Hooks**: `useAccessState` and `useVisibility` for the RBAC layer,
  `useKeyboardHeight`, `useRefreshControl`.
- **Injected platform adapters** on the provider, all optional:
  `storage` for the mode, `haptics` for feedback, `datePicker` for the
  native picker. Without the picker a `DateField` falls back to the
  calendar this library draws itself, and says so in development.
- Build through `react-native-builder-bob` into CommonJS, ESM and type
  definitions, with `/theme` and `/tokens` as subpath entry points.
  No native module, no Metro config, no Babel preset, no Expo
  requirement.

### Notes

- The four Dashforge core packages (`@dashforge/ui-core`,
  `@dashforge/forms`, `@dashforge/rbac`, `@dashforge/calendar-core`)
  are peer dependencies on `^2.0.1` and are consumed from npm.
- Source maps are not shipped: without the sources alongside them they
  resolve to nothing, and they were half the files in the tarball.

[Unreleased]: https://github.com/kensaadi/dashforge-rn/compare/%40dashforge%2Frn%400.0.1...HEAD
[0.0.1]: https://github.com/kensaadi/dashforge-rn/releases/tag/%40dashforge%2Frn%400.0.1
