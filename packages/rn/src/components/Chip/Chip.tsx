import { Pressable, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { chipRecipe } from './chip.variants';
import type { ChipProps } from './chip.types';

/**
 * A small thing that can be chosen, or taken away.
 *
 * **It is announced as what it actually is**, which is three different
 * things depending on what it was given. With `selected` and an
 * `onPress` it is a switch, because it has an on and an off and a reader
 * needs to hear which. With only an `onPress` it is a button. With
 * neither it is text: nothing about it is pressable, and calling it a
 * button would be a promise it does not keep.
 *
 * **The cross is its own target with its own name.** "Remove Milano" and
 * "Choose Milano" are two different answers, and a reader handed one
 * element cannot tell them apart. That is also why `removeLabel`
 * defaults to the chip's own word rather than a bare "Remove": eleven
 * chips announcing "Remove" eleven times is a list nobody can use.
 *
 * Grouping is the caller's: a row of `Chip` inside a `Stack` is a filter
 * bar, and which of them are chosen is state the screen already has.
 * One answer among several with a name and a payload is `RadioGroup` or
 * `SegmentedControl`.
 *
 * @example
 * ```tsx
 * <Chip label="Milano" selected={on} onPress={toggle} />
 * <Chip label="Milano" onRemove={() => drop('milano')} color="secondary" />
 * <Chip label="Bozza" color="warning" />
 * ```
 */
export function Chip(props: ChipProps) {
  const themeDefaults = useComponentDefaults('Chip');
  const tokens = useComponentTokens('Chip');
  const theme = useTheme();

  const {
    label,
    icon: Icon,
    selected = false,
    onPress,
    onRemove,
    removeLabel,
    color = 'primary',
    size = 'md',
    radius = 'full',
    disabled = false,
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as ChipProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const inactive = disabled || accessState.disabled || accessState.readonly;
  const resolve = chipRecipe(tokens);
  const selectable = Boolean(onPress) && props.selected !== undefined;

  const body = (pressed: boolean) => {
    const styles = resolve({
      size,
      radius,
      color,
      selected,
      pressed: pressed && !inactive,
      disabled: inactive,
    });
    const labelColor = styles.label.color as string;

    return (
      <>
        {Icon ? <Icon size={tokens.iconSize[size]} color={labelColor} /> : null}
        <Text numberOfLines={1} style={[styles.label, sx?.label]}>
          {label}
        </Text>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={removeLabel ?? `Rimuovi ${label}`}
            accessibilityState={{ disabled: inactive }}
            disabled={inactive}
            onPress={onRemove}
            hitSlop={tokens.remove.hitSlop}
            style={[styles.remove, sx?.remove]}
          >
            {/*
              Two arms of one cross, drawn from views. This package ships
              no icon set and imports no drawing library, and a cross is
              two rectangles turned against each other.
            */}
            <View style={[styles.removeArm, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.removeArm, { transform: [{ rotate: '-45deg' }] }]} />
          </Pressable>
        ) : null}
      </>
    );
  };

  const dimmed = inactive ? { opacity: theme.semantic.opacity.disabled } : null;

  if (!onPress) {
    // Text, and announced as text. Nothing about it is pressable, and a
    // button that does nothing is worse than a label.
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel ?? label}
        style={[resolve({ size, radius, color, selected, disabled: inactive }).root, dimmed, sx?.root]}
      >
        {body(false)}
      </View>
    );
  }

  return (
    <Pressable
      // A chip that can be chosen has an on and an off, and that is a
      // switch. One that only acts is a button.
      accessibilityRole={selectable ? 'switch' : 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        selectable
          ? { checked: selected, disabled: inactive }
          : { disabled: inactive }
      }
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        resolve({
          size,
          radius,
          color,
          selected,
          pressed: pressed && !inactive,
          disabled: inactive,
        }).root,
        dimmed,
        sx?.root,
      ]}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}
