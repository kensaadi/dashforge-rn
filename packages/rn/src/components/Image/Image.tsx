import { useEffect, useState } from 'react';
import { Image as RNImage, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { ImageProps } from './image.types';

/**
 * A picture that behaves when it does not arrive.
 *
 * React Native's own `Image` has two failure modes and no answer for
 * either: a remote picture that is slow leaves a hole the size of
 * nothing, because an `Image` with no height has none until it loads,
 * and one that fails leaves that hole forever. This keeps the box
 * whatever happens, so the page does not jump when the picture lands,
 * and it shows something rather than nothing when it does not.
 *
 * **The label is left out on purpose more often than it is given.** A
 * photograph beside a title that names it is decoration, and the right
 * outcome for decoration is to be skipped rather than described twice.
 * With no label the picture is hidden from the reader entirely, which is
 * the same call `Card.Media` makes.
 *
 * @example
 * ```tsx
 * <Image source={{ uri: product.photo }} aspectRatio={1} radius="md" />
 * <Image source={{ uri: user.cover }} height={160} accessibilityLabel="La copertina di Ada" />
 * ```
 */
export function Image(props: ImageProps) {
  const themeDefaults = useComponentDefaults('Image');
  const tokens = useComponentTokens('Image');

  const {
    source,
    accessibilityLabel,
    aspectRatio = 16 / 9,
    height,
    width = '100%',
    resizeMode = 'cover',
    radius = 'none',
    fallback,
    errorFallback,
    access,
    visibleWhen,
    sx,
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as ImageProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const [state, setState] = useState<'loading' | 'ready' | 'broken'>('loading');

  // A new picture deserves its own chance: without this one dead URL
  // would keep the box on its fallback for the rest of the session even
  // after the caller handed it a working one.
  useEffect(() => setState('loading'), [source]);

  if (!isVisible || !accessState.visible) return null;

  const described = Boolean(accessibilityLabel);

  return (
    <View
      // The box holds the shape whatever the picture does, which is what
      // stops the page jumping when it lands.
      style={[
        {
          width,
          height,
          aspectRatio: height === undefined ? aspectRatio : undefined,
          borderRadius: tokens.radius[radius],
          backgroundColor: tokens.placeholder,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        sx?.root,
      ]}
    >
      {state === 'broken' ? (
        (errorFallback ?? (
          // A cross in the middle of the placeholder. Not an apology,
          // just the honest thing: something was meant to be here.
          <View style={{ width: tokens.broken.size, height: tokens.broken.size }}>
            <View
              style={{
                position: 'absolute',
                top: tokens.broken.size / 2,
                width: tokens.broken.size,
                height: tokens.broken.thickness,
                backgroundColor: tokens.broken.color,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: tokens.broken.size / 2,
                width: tokens.broken.size,
                height: tokens.broken.thickness,
                backgroundColor: tokens.broken.color,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        ))
      ) : (
        <>
          {state === 'loading' ? fallback : null}
          <RNImage
            source={source}
            resizeMode={resizeMode}
            onLoad={() => setState('ready')}
            onError={() => setState('broken')}
            // Announced only when it was given something to say. A
            // picture beside a title that names it is decoration.
            accessible={described}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={described ? 'image' : undefined}
            importantForAccessibility={described ? 'yes' : 'no-hide-descendants'}
            style={[
              {
                width: '100%',
                height: '100%',
                // Hidden rather than unmounted while it loads: an image
                // that is not rendered never loads, and the fallback
                // would be all there ever was.
                opacity: state === 'ready' ? 1 : 0,
                position: state === 'ready' ? 'relative' : 'absolute',
              },
              sx?.image,
            ]}
          />
        </>
      )}
    </View>
  );
}
