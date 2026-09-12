import { Pressable, Text } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import { resolveTypeStyle } from '../../theme/typography';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { FABProps } from './fab.types';

/**
 * The one action a screen is about, floating over it.
 *
 * **`accessibilityLabel` is required.** A circle with a plus in it is
 * announced as nothing at all, and this is the one component in the
 * library where there is no text to fall back on. Making it a required
 * prop is the only way to stop that being forgotten, and it costs a
 * caller four words.
 *
 * `bottomInset` is the safe area **plus whatever it has to clear**: a
 * button that floats over a `TabBar` is a button that covers a
 * destination. Only the caller knows what is under it.
 *
 * @example
 * ```tsx
 * <FAB icon={Plus} accessibilityLabel="Nuovo ordine" onPress={create}
 *      bottomInset={insets.bottom + 52} />
 * <FAB icon={Pencil} label="Scrivi" accessibilityLabel="Scrivi un messaggio" onPress={write} />
 * ```
 */
export function FAB(props: FABProps) {
  const themeDefaults = useComponentDefaults('FAB');
  const tokens = useComponentTokens('FAB');
  const theme = useTheme();

  const {
    icon: Icon,
    accessibilityLabel,
    label,
    onPress,
    position = 'bottom-end',
    bottomInset = 0,
    color = 'primary',
    size = 'md',
    disabled = false,
    access,
    visibleWhen,
    sx,
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as FABProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const inert = disabled || accessState.disabled || accessState.readonly;
  const role = theme.semantic.action[color];
  const box = tokens.size[size];

  const corner =
    position === 'none'
      ? null
      : {
          position: 'absolute' as const,
          bottom: tokens.margin + bottomInset,
          ...(position === 'bottom-end'
            ? { right: tokens.margin }
            : { left: tokens.margin }),
        };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inert }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: box,
          minWidth: box,
          borderRadius: tokens.radius,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: label ? tokens.gap : 0,
          // A word turns the circle into a pill, and a pill needs air at
          // both ends that a circle does not.
          paddingHorizontal: label ? tokens.paddingHorizontal : 0,
          backgroundColor: inert
            ? role.bgDisabled
            : pressed
              ? role.bgPressed
              : role.bg,
          ...tokens.elevation,
        },
        corner,
        inert ? { opacity: theme.semantic.opacity.disabled } : null,
        sx?.root,
      ]}
    >
      <Icon size={tokens.iconSize[size]} color={inert ? role.fgDisabled : role.fg} />
      {label ? (
        <Text
          numberOfLines={1}
          style={[
            { ...resolveTypeStyle(tokens.typography.label), color: inert ? role.fgDisabled : role.fg },
            sx?.label,
          ]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
