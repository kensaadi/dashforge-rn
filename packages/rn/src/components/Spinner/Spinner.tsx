import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { SpinnerProps } from './spinner.types';

/**
 * The turning ring.
 *
 * **Drawn here and not delegated to `ActivityIndicator`**, which is the
 * opposite of the call made for `Modal` and for the platform pickers.
 * The three buckets in ARCHITECTURE.md settle it: a spinner is
 * appearance, and appearance is ours on both platforms. Bucket three is
 * date pickers, action sheets and share sheets, the surfaces a user
 * recognises as belonging to the operating system; nobody has ever
 * recognised a spinner.
 *
 * There is a hard reason underneath the principle. `ActivityIndicator`
 * takes `small` or `large` and nothing else on iOS, where a numeric size
 * is ignored, so a token scale could not be honoured: the same `md`
 * would be one size on Android and another on iOS, and that is the
 * token-first premise collapsing in the small.
 *
 * It keeps turning under Reduce Motion. A spinner is one small element
 * saying "still working", the platform's own indicators do not stop
 * either, and a still spinner says the opposite of what it means. That
 * is not the call `Skeleton` makes, and the difference is the size of
 * the moving surface.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" accessibilityLabel="Carico gli ordini" />
 * ```
 */
export function Spinner(props: SpinnerProps) {
  const themeDefaults = useComponentDefaults('Spinner');
  const tokens = useComponentTokens('Spinner');

  const {
    size = 'md',
    color = 'primary',
    tint,
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as SpinnerProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: tokens.duration,
        // Linear, and nothing else. Any easing makes the ring hesitate
        // once per turn, which reads as the app stalling.
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn, tokens.duration]);

  if (!isVisible || !accessState.visible) return null;

  const box = tokens.size[size];
  const arc = tint ?? tokens.color[color];

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      // Announced as busy even with no words, because that is the one
      // thing a spinner always means.
      accessibilityState={{ busy: true }}
      {...rest}
      style={[
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          borderWidth: tokens.thickness[size],
          // Two sides coloured and two transparent, which the mitred
          // corners taper into a half ring. There is no track behind it:
          // a neutral ring would be wrong on every coloured ground the
          // spinner gets dropped onto, and a tinted one needs an alpha
          // this library does not keep tokens for.
          borderColor: 'transparent',
          borderTopColor: arc,
          borderRightColor: arc,
          transform: [
            {
              rotate: turn.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        sx?.root,
      ]}
    />
  );
}
