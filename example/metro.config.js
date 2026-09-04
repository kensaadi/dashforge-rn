const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Metro configuration for a pnpm workspace.
 *
 * Two additions over the default, both required and both about the fact
 * that `@dashforge/rn` lives outside this directory:
 *
 *  - `watchFolders` — Metro only watches the project root by default, so
 *    without the workspace root it neither reads nor rebuilds on changes
 *    to the library source.
 *  - `nodeModulesPaths` — pnpm links the library into
 *    `example/node_modules/@dashforge/rn` but its transitive dependencies
 *    resolve out of the workspace store, which Metro has to be told about.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const libSrc = path.resolve(workspaceRoot, 'packages/rn/src');

/**
 * `@dashforge/rn` and its subpaths, mapped straight to source.
 *
 * The package's `exports` point at `dist`, and TypeScript reaches the
 * source through the `@dashforge/source` custom condition. Metro does
 * not honour custom conditions, so without this the example app runs the
 * last build and every library edit needs a `pnpm build` before it shows
 * up. Metro compiles the TypeScript itself, so pointing at source costs
 * nothing and turns the example back into a live harness.
 */
const dashforgeSource = {
  '@dashforge/rn': path.join(libSrc, 'index.ts'),
  '@dashforge/rn/theme': path.join(libSrc, 'theme/index.ts'),
  '@dashforge/rn/tokens': path.join(libSrc, 'tokens/index.ts'),
};

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    resolveRequest: (context, moduleName, platform) => {
      const mapped = dashforgeSource[moduleName];
      if (mapped) return { type: 'sourceFile', filePath: mapped };
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
