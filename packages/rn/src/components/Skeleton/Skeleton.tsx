import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { SkeletonProps, SkeletonTextProps } from './skeleton.types';

/**
 * The breathing every skeleton on a screen shares.
 *
 * One value per element rather than one for the screen, which is the
 * honest trade: a shared clock would need a provider, and a provider
 * that has to be mounted for a component to look right is a component
 * that breaks quietly when somebody forgets it. The values are driven
 * natively, so the count costs frames only on the shadow tree.
 */
function usePulse(duration: number, still: boolean) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, duration, still]);

  return pulse;
}

/**
 * A block standing in for content that has not arrived.
 *
 * **It pulses rather than shimmers**, and that is a constraint before it
 * is a taste: a shimmer is a gradient travelling across the block, and
 * this package imports no native capability, gradients included. A pulse
 * is opacity, which needs nothing and runs on the native driver.
 *
 * **It stops under Reduce Motion**, unlike `Spinner`. The difference is
 * how much of the screen is moving: a spinner is one small element that
 * has to keep turning to mean anything, while a loading screen is a
 * field of blocks all breathing at once, which is exactly the repetitive
 * motion the setting exists to switch off. Stopped, it still says what
 * it needs to say, because the shape is the message.
 *
 * @example
 * ```tsx
 * <Skeleton width={120} height={16} />
 * <Skeleton width={40} height={40} radius="full" />
 * <Skeleton.Text lines={2} />
 * ```
 */
export function Skeleton(props: SkeletonProps) {
  const themeDefaults = useComponentDefaults('Skeleton');
  const tokens = useComponentTokens('Skeleton');
  const reduceMotion = useReduceMotion();

  const {
    width = '100%',
    height = tokens.line.height,
    radius = 'sm',
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as SkeletonProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const pulse = usePulse(tokens.duration, reduceMotion);

  if (!isVisible || !accessState.visible) return null;

  return (
    <Animated.View
      // Nothing to announce. A screen reader reading out eight grey
      // rectangles is worse than silence; the screen around them says
      // that something is loading.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...rest}
      style={[
        {
          width,
          height,
          borderRadius: tokens.radius[radius],
          backgroundColor: tokens.color,
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [tokens.opacity.from, tokens.opacity.to],
          }),
        },
        sx?.root,
      ]}
    />
  );
}

/**
 * A paragraph's worth of blocks.
 *
 * The last line is short, because a paragraph does not end at the right
 * margin and a stack of identical bars reads as a table.
 *
 * @internal Reached as `Skeleton.Text`.
 */
export function SkeletonText(props: SkeletonTextProps) {
  const tokens = useComponentTokens('Skeleton');
  const reduceMotion = useReduceMotion();

  const { lines = 3, lastWidth = tokens.line.lastWidth, access, visibleWhen, sx, ...rest } =
    props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const pulse = usePulse(tokens.duration, reduceMotion);

  if (!isVisible || !accessState.visible) return null;

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [tokens.opacity.from, tokens.opacity.to],
  });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...rest}
      style={[{ gap: tokens.line.gap }, sx?.root]}
    >
      {Array.from({ length: Math.max(0, lines) }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: i === lines - 1 && lines > 1 ? lastWidth : '100%',
              height: tokens.line.height,
              borderRadius: tokens.radius.sm,
              backgroundColor: tokens.color,
              opacity,
            },
            sx?.line,
          ]}
        />
      ))}
    </View>
  );
}
SkeletonText.displayName = 'Skeleton.Text';

Skeleton.Text = SkeletonText;
