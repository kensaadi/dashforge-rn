# dashforge-rn

The React Native renderer for [Dashforge](https://github.com/kensaadi/dashforge).

A separate repository on purpose. The Dashforge monorepo is a web
toolchain (Vite, vitest, rollup, Nx) with a workspace-wide React
override, and React Native pins its renderer to an exact React version.
Keeping this out avoids that collision, keeps Metro away from pnpm's
symlink layout, and keeps a native toolchain out of a workspace that has
no other use for one.

The four shared core packages (`@dashforge/ui-core`, `@dashforge/forms`,
`@dashforge/rbac`, `@dashforge/calendar-core`) are consumed from npm.

## Layout

```
ARCHITECTURE.md      the normative design document. Read it first.
packages/rn/         @dashforge/rn
example/             bare React Native CLI app (not created yet)
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Architecture

[`ARCHITECTURE.md`](./ARCHITECTURE.md) is normative. When an
implementation choice contradicts it, the document wins or the document
gets amended first.
