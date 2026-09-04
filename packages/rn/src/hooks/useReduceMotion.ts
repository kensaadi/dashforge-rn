import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the platform's reduce-motion setting is on.
 *
 * Not a refinement. For a share of people those transitions are
 * physically unpleasant, and the setting is how they say so. A component
 * that reads this changes the *manner* of a change, never whether the
 * change happens: content still arrives, it just stops moving on the way
 * in.
 *
 * Starts `false` and corrects itself on the first tick, because the
 * platform answer is asynchronous. That is the right way round: a first
 * frame without animation is invisible, while a first frame that
 * animates against the setting is exactly what the setting exists to
 * prevent, so the value is read before anything has had reason to move.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduce(value);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );

    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}
