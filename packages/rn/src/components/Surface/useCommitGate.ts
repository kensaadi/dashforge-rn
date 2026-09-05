import { useEffect, useRef, useState, type RefObject } from 'react';
import { claimStaggerSlot } from './stagger';
import { useViewport, type MeasurableView } from './SurfaceViewport';
import type { SurfaceProps } from './surface.types';

/** How long a measurement has to answer before the gate stops waiting. */
const MEASURE_DEADLINE_MS = 50;

/** What the gate lets through, and how. */
export interface Commit {
  /** The branch the surface is allowed to be showing. */
  key: string | null;
  /**
   * True when the change need not be animated, because it happens below
   * the fold where nobody can see it move. Not the same as reduced
   * motion, which is about the manner of a change the user *can* see.
   */
  instant: boolean;
}

/**
 * Decide *when* an answer may be applied, having been told what it is.
 *
 * The matcher says which branch should be showing and the transition
 * says how it arrives; this sits between them and says not yet.
 *
 * Three situations, and each has one answer:
 *
 * - **A scroll is in flight.** Nothing changes anywhere. Any height
 *   change during momentum moves the landing point, so the user flicks
 *   aiming at something and arrives somewhere else.
 * - **Settled, and the region is below the viewport.** Applied at once
 *   and without a transition: nothing visible moves, and when the user
 *   scrolls down the content is simply already there. Waiting for the
 *   region to come into view would make content materialise as you
 *   arrive at it, which is the opposite of what is wanted.
 * - **Settled, and the region is in view or above it.** Applied with the
 *   transition.
 *
 * @internal
 */
export function useCommitGate(
  desired: string | null,
  policy: NonNullable<SurfaceProps['commit']>,
  box: RefObject<MeasurableView | null>,
): Commit {
  const viewport = useViewport();
  const [commit, setCommit] = useState<Commit>({ key: desired, instant: true });
  const applied = useRef<string | null>(desired);
  const warned = useRef(false);
  // This surface's identity in a stagger batch, stable for its lifetime.
  const identity = useRef(Symbol('surface')).current;

  useEffect(() => {
    if (desired === applied.current) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    const apply = (instant: boolean) => {
      // Two regions changing in the same tick are not read as two
      // changes, they are read as the app blinking.
      const delay = claimStaggerSlot(identity);
      const run = () => {
        if (cancelled) return;
        applied.current = desired;
        setCommit({ key: desired, instant });
      };
      if (delay > 0) timer = setTimeout(run, delay);
      else run();
    };

    if (policy === 'immediate') {
      apply(false);
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }

    if (!viewport) {
      if (__DEV__ && !warned.current) {
        warned.current = true;
        console.warn(
          '[@dashforge/rn] <Surface commit="settled"> is not inside a <SurfaceViewport>, ' +
            'so there is nothing to tell it when the user is scrolling and it behaves as ' +
            'commit="immediate". React Native has no ambient scroll state; wrap the ' +
            'scroll container to get this.',
        );
      }
      apply(false);
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }

    const attempt = () => {
      if (cancelled) return;
      // Still moving: stay subscribed and try again when it stops.
      if (viewport.getState().scrolling) return;

      unsubscribe?.();
      unsubscribe = undefined;

      const node = box.current;
      if (!node) {
        apply(false);
        return;
      }

      // The measurement gets a deadline. `measureInWindow` answers on a
      // mounted native view, but a change that never lands because a
      // measurement never answered is the same stuck-half-way failure
      // the transition avoids by hanging its end off the fade. Whichever
      // arrives first wins, and the fallback is the cautious answer:
      // apply, and animate.
      let answered = false;
      const deadline = setTimeout(() => {
        if (answered || cancelled) return;
        answered = true;
        apply(false);
      }, MEASURE_DEADLINE_MS);

      node.measureInWindow((_x, y) => {
        if (answered || cancelled) return;
        answered = true;
        clearTimeout(deadline);
        const { top, height } = viewport.getState();
        // Entirely past the bottom edge: nothing the user can see moves,
        // so there is nothing to animate for.
        apply(y >= top + height);
      });
    };

    unsubscribe = viewport.subscribe(attempt);
    attempt();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe?.();
    };
    // `desired` is the input; everything else is machinery that does not
    // restart a decision already taken.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desired, policy, viewport]);

  return commit;
}
