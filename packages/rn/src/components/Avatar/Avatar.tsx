import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { avatarRecipe } from './avatar.variants';
import type { AvatarProps } from './avatar.types';

/**
 * The letters shown when there is no picture.
 *
 * The first letter of the first word and of the last, which is the rule
 * that survives a middle name and a surname made of two words. One word
 * gives one letter rather than the first two of it: "Ke" for Kenjy reads
 * as a truncation, "K" reads as a monogram.
 *
 * Exported so it can be tested against the names that break it.
 *
 * @internal
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = [...words[0]!][0] ?? '';
  const last = words.length > 1 ? ([...words[words.length - 1]!][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * A person, at whatever size the screen has room for.
 *
 * Three things to show, in order: the picture, the initials of the name,
 * an icon. It walks down that list on its own, and it walks down it
 * again **when a picture fails to load**, which is the case a component
 * that only looks at its props gets wrong: a URL that 404s leaves a hole
 * where a face was.
 *
 * @example
 * ```tsx
 * <Avatar source={{ uri: user.photo }} name={user.name} />
 * <Avatar name="Kenjy Saadi" size="lg" />
 * <Avatar icon={Person} radius="md" />
 * ```
 */
export function Avatar(props: AvatarProps) {
  const themeDefaults = useComponentDefaults('Avatar');
  const tokens = useComponentTokens('Avatar');

  const {
    source,
    name,
    icon: Icon,
    size = 'md',
    radius = 'full',
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as AvatarProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const [broken, setBroken] = useState(false);

  // A new picture deserves its own chance: without this, one dead URL
  // would keep the avatar on its fallback for the rest of the session
  // even after the caller handed it a working one.
  useEffect(() => setBroken(false), [source]);

  if (!isVisible || !accessState.visible) return null;

  const styles = avatarRecipe(tokens)({ size, radius });
  const initials = name ? initialsOf(name) : '';
  const showImage = Boolean(source) && !broken;

  return (
    <View
      // One element with one name, rather than a circle whose letters are
      // read out as text: "KS" is not what a reader should say about a
      // photograph of somebody.
      accessible={Boolean(accessibilityLabel ?? name)}
      accessibilityRole={accessibilityLabel ?? name ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel ?? name}
      {...rest}
      style={[styles.root, sx?.root]}
    >
      {showImage ? (
        <Image
          source={source!}
          resizeMode="cover"
          onError={() => setBroken(true)}
          style={[styles.image, sx?.image]}
        />
      ) : initials ? (
        <Text
          // Already announced by the wrapper, so the letters stay out of
          // the reading order rather than being said twice.
          importantForAccessibility="no"
          style={[styles.initials, sx?.initials]}
        >
          {initials}
        </Text>
      ) : Icon ? (
        <Icon size={tokens.iconSize[size]} color={tokens.color.fg} />
      ) : null}
    </View>
  );
}
