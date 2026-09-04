import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent } from 'react-native';

/** The moving parts a `Surface` needs to render a change of branch. */
export interface BranchTransition {
  /** The branch currently in flow. */
  shownKey: string | null;
  /** The branch on its way out, overlaid while it fades. */
  outgoingKey: string | null;
  /** True while the region is between branches. */
  animating: boolean;
  /** Container height, driven only while animating. */
  height: Animated.Value;
  incomingOpacity: Animated.Value;
  incomingScale: Animated.Value;
  outgoingOpacity: Animated.Value;
  /** Measures the branch in flow. Must be on the wrapper, not the content. */
  onIncomingLayout: (event: LayoutChangeEvent) => void;
}

/** Where the incoming branch starts. Small enough to read as settling. */
const ENTRY_SCALE = 0.98;

/**
 * Drive the change from one branch to another.
 *
 * **A dissolve, not a slide.** A slide says something arrived from
 * somewhere else, which is false: nothing travelled, the region changed
 * its mind. The dissolve is the only motion that describes what actually
 * happened, and it is the one that can happen twenty times in a session
 * without being noticed as an effect.
 *
 * The outgoing branch leaves faster than the incoming arrives, with a
 * short overlap, so there is never a frame showing neither.
 *
 * **Height is the tedious part.** If the new branch is taller the region
 * has to grow, and height does not animate for free in React Native. The
 * incoming branch is laid out at its natural height while the container
 * is clipped to the old one, so its `onLayout` reports the target and
 * the container is animated to it. One frame of measurement, no
 * dependency, and no hard jump to undo the rest.
 *
 * @internal
 */
export function useBranchTransition(
  targetKey: string | null,
  animated: boolean,
  durations: { exit: number; enter: number },
): BranchTransition {
  const [shownKey, setShownKey] = useState<string | null>(targetKey);
  const [outgoingKey, setOutgoingKey] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const height = useRef(new Animated.Value(0)).current;
  const incomingOpacity = useRef(new Animated.Value(1)).current;
  const incomingScale = useRef(new Animated.Value(1)).current;
  const outgoingOpacity = useRef(new Animated.Value(0)).current;

  /** Last natural height reported by the branch in flow. */
  const naturalHeight = useRef(0);
  /** True between starting a change and the incoming branch measuring. */
  const awaitingLayout = useRef(false);
  const animatingRef = useRef(false);
  const timing = useRef(durations);
  timing.current = durations;

  /**
   * End the change: drop the outgoing branch and give the height back to
   * the content.
   *
   * Idempotent, and hung off the cross-fade rather than off the height,
   * because the fade always runs while the height animation waits for a
   * measurement that a zero-sized or never-laid-out branch would never
   * produce. Tying the end of the change to the thing that always
   * happens is what keeps a region from being stuck mid-change.
   */
  const settle = useRef((result: { finished: boolean }) => {
    if (!result.finished || !animatingRef.current) return;
    animatingRef.current = false;
    setAnimating(false);
    setOutgoingKey(null);
  }).current;

  const onIncomingLayout = useRef((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    naturalHeight.current = measured;

    // Not between branches: keep the value current so an interrupted
    // change has somewhere honest to start from.
    if (!animatingRef.current) {
      height.setValue(measured);
      return;
    }

    if (!awaitingLayout.current) return;
    awaitingLayout.current = false;

    // Height cannot go on the native driver, which is why it is a value
    // of its own on a view of its own: opacity and scale stay native.
    Animated.timing(height, {
      toValue: measured,
      duration: timing.current.enter,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }).current;

  useEffect(() => {
    if (targetKey === shownKey) return;

    if (!animated) {
      setShownKey(targetKey);
      return;
    }

    // Start from where the region actually is, not from where it was
    // heading, so a change arriving mid-change does not jump first.
    let from = naturalHeight.current;
    height.stopAnimation((value) => {
      if (typeof value === 'number' && value > 0) from = value;
    });
    height.setValue(from);

    animatingRef.current = true;
    awaitingLayout.current = targetKey !== null;
    setAnimating(true);
    setOutgoingKey(shownKey);
    setShownKey(targetKey);

    incomingOpacity.setValue(0);
    incomingScale.setValue(ENTRY_SCALE);
    outgoingOpacity.setValue(1);

    Animated.timing(outgoingOpacity, {
      toValue: 0,
      duration: timing.current.exit,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(incomingOpacity, {
        toValue: 1,
        duration: timing.current.enter,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(incomingScale, {
        toValue: 1,
        duration: timing.current.enter,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(settle);

    // Collapsing: there is no incoming branch to measure, so the target
    // is known already and nothing has to be waited for.
    if (targetKey === null) {
      Animated.timing(height, {
        toValue: 0,
        duration: timing.current.enter,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
    // `shownKey` is deliberately out of the dependency list: it is what
    // this effect writes, and reacting to it would restart the change it
    // just made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, animated]);

  useEffect(
    () => () => {
      height.stopAnimation();
      incomingOpacity.stopAnimation();
      incomingScale.stopAnimation();
      outgoingOpacity.stopAnimation();
    },
    [height, incomingOpacity, incomingScale, outgoingOpacity],
  );

  return {
    shownKey,
    outgoingKey,
    animating,
    height,
    incomingOpacity,
    incomingScale,
    outgoingOpacity,
    onIncomingLayout,
  };
}
