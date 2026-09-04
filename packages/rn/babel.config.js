/**
 * Replace `import.meta` with a plain object.
 *
 * Working around a defect in the published `@dashforge/forms@1.0.0`: it
 * bundles valtio rather than externalising it, and drags in valtio's
 * dev-mode check, which is written as `import.meta.env.MODE`. That is a
 * Vite-ism and invalid in the CommonJS output Babel produces, so any CJS
 * consumer of the package fails to parse it.
 *
 * Resolving to `'production'` also disables valtio's development
 * assertions, which is what we want in a bundled dependency we do not
 * own.
 *
 * Remove this once `@dashforge/forms` externalises valtio. Tracked in
 * the monorepo's bug register.
 */
const transformImportMeta = () => ({
  visitor: {
    MetaProperty(path) {
      path.replaceWithSourceString("({ env: { MODE: 'production' } })");
    },
  },
});

module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [transformImportMeta],
};
