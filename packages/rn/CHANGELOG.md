# Changelog

All notable changes to `@dashforge/rn` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Project scaffolding: single package with `/theme` and `/tokens`
  subpath entry points, builder-bob build, Jest with
  `@testing-library/react-native`.
- Bare React Native CLI example app under `example/`, wired to the
  library through the pnpm workspace, with Metro configured for the
  monorepo layout (`watchFolders` + `nodeModulesPaths`).
