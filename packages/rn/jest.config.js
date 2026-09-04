module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/src/**/*.{test,spec}.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.{test,spec}.{ts,tsx}'],

  // The RN preset ships:
  //   'node_modules/(?!((jest-)?react-native|@react-native(-community)?)/)'
  // which assumes npm's flat layout, where an allowed package sits
  // directly under `node_modules/`. pnpm stores it at
  // `node_modules/.pnpm/<name>@<version>_<hash>/node_modules/<name>/`,
  // so the first `node_modules/` is followed by `.pnpm` — never in the
  // allowlist — and the preset's own ESM `jest/setup.js` is left
  // untransformed. It then fails on its first `import`.
  //
  // Matching the package name anywhere in the path works for both
  // layouts: pnpm encodes it in the store directory AND in the inner
  // `node_modules`. Over-matching only costs a redundant Babel pass.
  // `@dashforge/*` is in the list because the core packages ship ESM
  // only: their `exports` map points at `index.esm.js` for `import`,
  // `default` and everything else, so a CJS resolver gets ESM and Jest
  // has to transform it rather than skip it.
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@testing-library|@dashforge))',
  ],
};
