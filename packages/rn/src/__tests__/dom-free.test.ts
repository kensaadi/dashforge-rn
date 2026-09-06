/**
 * The core packages must not render DOM elements.
 *
 * **This is the check that BUG 10 got past.** The portability audit
 * before this library existed grepped for browser *globals*: `document`,
 * `window`, `HTMLElement`, `navigator`, `localStorage`. All clean. What
 * it did not grep for was JSX host elements, and `@dashforge/forms`
 * renders a literal `<form>` inside `DashForm`.
 *
 * React Native has no DOM elements at all. It looks a lowercase tag up
 * in its own native view registry, does not find it, and throws before
 * anything of ours renders:
 *
 * ```
 * View config getter callback for component `form` must be a function
 * (received `undefined`).
 * ```
 *
 * The test renderer does not catch this: it is permissive about unknown
 * host components and renders `DashForm` without complaint. Only a
 * device says so. Which is exactly why this is a static check over the
 * shipped files rather than a render.
 *
 * **Known offenders are listed rather than fixed here**, because they
 * are somebody else's package and they are correct on the web. What this
 * catches is a *new* one arriving in a core package the renderers share.
 */

/**
 * Node's own, shaped here rather than pulled in as ambient types.
 *
 * `@types/node` in this package's `types` would put `fs` and friends in
 * scope for every component file, and a library that has to run on a
 * phone has no business being able to typecheck a call to the file
 * system. This is the one file that reads the disk, so it is the one
 * file that describes it.
 */
interface NodeFs {
  readdirSync(dir: string): string[];
  readFileSync(path: string, encoding: 'utf8'): string;
  statSync(path: string): { isDirectory(): boolean };
}

const { readdirSync, readFileSync, statSync } = require('fs') as NodeFs;

/**
 * `require.resolve` is not on the ambient `NodeRequire` this package
 * sees, which carries only what React Native's own types declare. Named
 * once here rather than cast at the call site.
 */
const resolveModule = (require as unknown as { resolve(id: string): string }).resolve;

/** Enough of `path` for this, without a second declaration to maintain. */
const join = (dir: string, entry: string) => `${dir}/${entry}`;
const dirname = (path: string) => path.slice(0, path.lastIndexOf('/'));

/** What each core package is known to render, and why that is allowed. */
const ALLOWED: Record<string, { tags: string[]; because: string }> = {
  '@dashforge/ui-core': {
    tags: ['div'],
    because:
      'DOM-only helpers that the React Native renderer does not import. BUG 10 territory ' +
      'if one of them ever ends up on a shared path.',
  },
  '@dashforge/forms': {
    tags: ['form'],
    because:
      '`DashForm` is the provider plus a `<form>` for the browser’s native submit. ' +
      'Registered as BUG 10; React Native uses `DashFormProvider`, which is the provider ' +
      'alone and renders nothing.',
  },
  '@dashforge/rbac': { tags: [], because: 'Engine only, no elements.' },
  '@dashforge/calendar-core': { tags: [], because: 'Deliberately DOM-free from the start.' },
};

/** `jsx("form", …)`, `jsxs("div", …)`, `createElement("span", …)`. */
const HOST_ELEMENT = /(?:jsx|jsxs|jsxDEV|createElement)\(\s*"([a-z][a-zA-Z0-9-]*)"/g;

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...filesUnder(path));
    else if (/\.(js|mjs|cjs)$/.test(entry)) out.push(path);
  }
  return out;
}

function domTagsIn(packageName: string): string[] {
  const dist = dirname(resolveModule(packageName));
  const found = new Set<string>();
  for (const file of filesUnder(dist)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(HOST_ELEMENT)) found.add(match[1]);
  }
  return [...found].sort();
}

describe('the core packages render no DOM', () => {
  it.each(Object.keys(ALLOWED))('%s', (name) => {
    // Equality and not "contains": something new appearing is the whole
    // point, and something disappearing means a bug was fixed upstream
    // and this list should say so.
    expect(domTagsIn(name)).toEqual(ALLOWED[name].tags.slice().sort());
  });

  it('and neither does this package', () => {
    // Our own JSX compiles to `jsx(View, …)` with an identifier, never a
    // string, because there is no lowercase tag to write in the first
    // place.
    expect(domTagsIn('@dashforge/rn')).toEqual([]);
  });
});
