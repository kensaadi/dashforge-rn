# @dashforge/rn

Token-first React Native UI library. Props, not styles.

Part of [Dashforge](https://github.com/kensaadi/dashforge), sharing its
reactive engine, form bridge and RBAC layer with the web renderers,
and nothing else.

> **Status:** pre-release. Nothing is published yet and the component
> surface is not written.

## What it is

A React Native library where every visual decision is a typed prop
resolved against design tokens, with no build step, no native modules,
and no Expo requirement.

- **Props, not styles.** You describe intent (`variant`, `color`,
  `size`), not appearance.
- **Zero configuration.** `pnpm add @dashforge/rn` and nothing else. No
  Metro config, no Babel preset, no prebuild, no dev client.
- **Three-tier tokens.** Primitive to semantic to component, so a
  rebrand is a remapping and dark mode is one tier swapping.
- **RBAC-aware and form-integrated**, through the shared Dashforge core.

## Documentation

The architecture is normative and lives in
[`ARCHITECTURE.md`](../../ARCHITECTURE.md) at the repo root. It is the
reference for how this package is built and why.
