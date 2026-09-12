/**
 * A type style is never spread raw into a React Native style.
 *
 * **This one shipped seven times before a screen showed it.** A
 * `TypeStyle` looks like a `TextStyle` and is not one: its `lineHeight`
 * is a **ratio of the font size**, not an absolute number, because React
 * Native scales `fontSize` when the reader raises the system text size
 * and leaves `lineHeight` alone. `resolveTypeStyle` multiplies the two
 * and rounds.
 *
 * Spread raw, the ratio arrives at React Native as an absolute: a line
 * box of `1.4` points, and the text disappears. TypeScript is happy,
 * because every field of a `TypeStyle` is a valid `TextStyle` field. The
 * tests were happy, because the test renderer reports the style it was
 * handed and never lays anything out. Only a device says so, which is
 * exactly the shape of the `dom-free` check next door, so it is the same
 * kind of check: static, over the source, naming what is wrong.
 */

/**
 * Node's own, shaped here rather than pulled in as ambient types, for
 * the same reason as in `dom-free.test.ts`: a library that has to run on
 * a phone has no business typechecking a call to the file system.
 */
// `export {}` at the end of the file: without it TypeScript treats this
// as a script, and its `NodeFs` and its `readFileSync` collide with the
// ones `dom-free.test.ts` declares the same way.
interface NodeFs {
  readdirSync(dir: string): string[];
  readFileSync(path: string, encoding: 'utf8'): string;
  statSync(path: string): { isDirectory(): boolean };
}

const { readdirSync, readFileSync, statSync } = require('fs') as NodeFs;

const join = (dir: string, entry: string) => `${dir}/${entry}`;

/**
 * Where the source is, without `__dirname`.
 *
 * The package's ambient types carry only what React Native declares, and
 * Node's globals are not among them. `require.resolve` is reached the
 * same way `dom-free.test.ts` reaches it, and the package's own entry
 * point is a file that is certain to exist.
 */
const resolveModule = (require as unknown as { resolve(id: string): string }).resolve;
const dirname = (path: string) => path.slice(0, path.lastIndexOf('/'));

/**
 * `...tokens.typography.title,` and every shape of it: the tokens may be
 * reached through `tokens`, `t`, or anything else a recipe names them.
 */
const RAW_SPREAD = /\.\.\.\s*[A-Za-z_$][\w$]*\.typography\.\w+\s*[,}]/g;

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...filesUnder(path));
      continue;
    }
    if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(path);
  }
  return out;
}

describe('type styles', () => {
  it('are resolved and never spread raw', () => {
    const root = dirname(resolveModule('../index'));
    const offenders: string[] = [];

    for (const file of filesUnder(join(root, 'components'))) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(RAW_SPREAD)) {
        // `...resolveTypeStyle(t.typography.title)` is the right shape
        // and does not match, since the spread is of the call.
        offenders.push(`${file.slice(root.length + 1)}: ${match[0].trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('catches the shape it is looking for', () => {
    // The guard is worth nothing if the pattern does not match what went
    // wrong, so here is what went wrong.
    const bad = 'style={{ ...tokens.typography.title, color: x }}';
    const good = 'style={{ ...resolveTypeStyle(tokens.typography.title), color: x }}';
    expect([...bad.matchAll(RAW_SPREAD)]).toHaveLength(1);
    expect([...good.matchAll(RAW_SPREAD)]).toHaveLength(0);
  });
});

export {};
