/**
 * Branch markers.
 *
 * `Surface` recognises its branches by a symbol stamped on the component
 * rather than by referential identity (`type === Case`). Identity breaks
 * in the two situations where a failure is hardest to read: fast refresh
 * replacing the module, and a consumer resolving two copies of the
 * package. `Symbol.for` is global, so both copies agree.
 *
 * Kept in its own module so the matcher can import the markers without
 * importing the components, which would be a cycle.
 */

/** Stamped on `Surface.Case`. */
export const SURFACE_CASE = Symbol.for('dashforge.rn.surface.case');

/** Stamped on `Surface.Fallback`. */
export const SURFACE_FALLBACK = Symbol.for('dashforge.rn.surface.fallback');

/** The stamp itself, read off the component in the matcher. */
export const BRANCH_MARKER = '$$dashforgeSurfaceBranch';

/** A component that `Surface` accepts as a branch. */
export interface BranchComponent {
  [BRANCH_MARKER]?: symbol;
}
