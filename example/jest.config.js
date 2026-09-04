module.exports = {
  preset: '@react-native/jest-preset',

  // Same pnpm fix as packages/rn: the RN preset's own pattern assumes
  // npm's flat layout, so under pnpm's `.pnpm` store its ESM
  // `jest/setup.js` is left untransformed and fails on its first
  // `import`. See packages/rn/jest.config.js for the full explanation.
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@testing-library|@dashforge))',
  ],
};
