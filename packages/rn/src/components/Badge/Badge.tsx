import { Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { badgeRecipe } from './badge.variants';
import type { BadgeProps } from './badge.types';

/**
 * A small marker: a count, a word, or a dot that only says "something".
 *
 * **It stands on its own and is never anchored to something else.** The
 * familiar web badge hangs off the corner of an icon, sticking out past
 * its parent's box, and that is exactly what React Native cannot promise:
 * Android clips a child to its parent's bounds, so the same code that
 * looks right on iOS loses a corner of the badge on Android. Put it in a
 * row beside what it counts, or in a `ListItem`'s trailing slot, which
 * is where it is wanted most of the time anyway.
 *
 * @example
 * ```tsx
 * <Badge count={12} color="danger" accessibilityLabel="12 non letti" />
 * <Badge variant="soft" color="success">Attivo</Badge>
 * <Badge dot color="danger" />
 * ```
 */
export function Badge(props: BadgeProps) {
  const themeDefaults = useComponentDefaults('Badge');
  const tokens = useComponentTokens('Badge');

  const {
    children,
    count,
    max = 99,
    dot = false,
    color = 'primary',
    variant = 'solid',
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as BadgeProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const styles = badgeRecipe(tokens)({ color, variant, dot });

  // A count wins over a label, and a dot wins over both: each of them is
  // a different answer to "what does this badge say", and the narrowest
  // one is the one the caller reached for last.
  const content = dot
    ? null
    : count !== undefined
      ? count > max
        ? `${max}+`
        : String(count)
      : children;

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      // Announced by the label it was given, or not at all. A bare "3"
      // read out in the middle of a row is noise, and a dot has nothing
      // to read.
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      {...rest}
      style={[styles.root, sx?.root]}
    >
      {typeof content === 'string' || typeof content === 'number' ? (
        <Text numberOfLines={1} style={[styles.label, sx?.label]}>
          {content}
        </Text>
      ) : (
        content
      )}
    </View>
  );
}
