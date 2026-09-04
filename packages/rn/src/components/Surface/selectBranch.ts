import { Children, isValidElement, type ReactNode } from 'react';
import {
  BRANCH_MARKER,
  SURFACE_CASE,
  SURFACE_FALLBACK,
  type BranchComponent,
} from './surface.markers';
import type { SurfaceCaseProps, SurfaceFallbackProps } from './surface.types';

/** The branch a `Surface` should be showing, or `null` for nothing. */
export interface SelectedBranch {
  /**
   * Stable identity for the winning branch.
   *
   * Passed as the key of the rendered subtree so that changing branch
   * replaces it rather than reconciling into it. Without this, two
   * branches rendering the same component type would update in place and
   * the outgoing one would never unmount.
   *
   * It is the branch's position, because that is what a branch is: the
   * first case, the second case, the fallback. Positions are stable,
   * since a case that should not apply says so with `when` rather than
   * by not being written.
   */
  key: string;
  /** What to render. */
  node: ReactNode;
}

/** Read the branch marker off a child's component, if it has one. */
function markerOf(type: unknown): symbol | undefined {
  return (type as BranchComponent | undefined)?.[BRANCH_MARKER];
}

/**
 * Choose the branch to show.
 *
 * The whole decision, and deliberately a pure function of the children:
 * no theme, no hooks, no platform. Everything else `Surface` does is
 * about *when* to apply the answer, never about what the answer is, so
 * this stays testable on its own.
 *
 * Three rules:
 *
 * - source order is the priority, and the first case whose `when` is
 *   true wins
 * - if none matches, the fallback wins
 * - if there is no fallback, nothing renders and the region takes no
 *   space
 *
 * @internal
 */
export function selectBranch(children: ReactNode): SelectedBranch | null {
  const items = Children.toArray(children);

  let winner: SelectedBranch | null = null;
  let fallback: SelectedBranch | null = null;
  let sawFallback = false;

  for (let index = 0; index < items.length; index += 1) {
    const child = items[index];

    if (!isValidElement(child)) {
      if (__DEV__) {
        console.warn(
          '[@dashforge/rn] <Surface> ignored a child that is not a <Surface.Case> or ' +
            '<Surface.Fallback>. Content belongs inside a branch, not beside one.',
        );
      }
      continue;
    }

    const marker = markerOf(child.type);

    if (marker === SURFACE_CASE) {
      if (__DEV__ && sawFallback) {
        console.warn(
          '[@dashforge/rn] <Surface> has a <Surface.Case> after its <Surface.Fallback>. ' +
            'It still applies, because cases are matched before the fallback is ' +
            'considered, but source order is the priority and reading it that way is ' +
            'misleading. Move the fallback last.',
        );
      }
      // First match wins, so later cases are not even inspected once one
      // has. This is what makes `A && !B` unnecessary to write: putting
      // B's case above A's says it.
      if (winner === null && (child.props as SurfaceCaseProps).when) {
        winner = { key: `case:${index}`, node: (child.props as SurfaceCaseProps).children };
      }
      continue;
    }

    if (marker === SURFACE_FALLBACK) {
      if (fallback === null) {
        fallback = {
          key: 'fallback',
          node: (child.props as SurfaceFallbackProps).children,
        };
      } else if (__DEV__) {
        console.warn(
          '[@dashforge/rn] <Surface> has more than one <Surface.Fallback>. The first is ' +
            'used and the rest are ignored.',
        );
      }
      sawFallback = true;
      continue;
    }

    if (__DEV__) {
      console.warn(
        '[@dashforge/rn] <Surface> ignored a child that is not a <Surface.Case> or ' +
          '<Surface.Fallback>. Content belongs inside a branch, not beside one.',
      );
    }
  }

  return winner ?? fallback;
}
