import { ActivityIndicator, Pressable } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { DashPressState } from '../Button/button.types';
import { iconButtonRecipe } from './iconButton.variants';
import type { IconButtonProps } from './iconButton.types';

/**
 * A button that is only a glyph.
 *
 * **It needs an `accessibilityLabel`, and says so in development when it
 * has none.** A button with a label announces itself; one with only an
 * icon announces nothing, and a screen reader is left saying "button".
 * The glyph is the affordance, not the name. This is the single most
 * common accessibility defect in a mobile toolbar, and it is invisible
 * to everyone who is not affected by it.
 *
 * `ghost` is the default here where `solid` is the default on `Button`:
 * an icon button is usually one of several in a toolbar, and five filled
 * circles in a row is a wall.
 *
 * The box is square, so the glyph sits in the middle of a shape rather
 * than in the middle of a rectangle, and `hitSlop` takes even the small
 * size past the forty-four point floor without growing it.
 *
 * @example
 * ```tsx
 * <IconButton icon={Trash2} color="danger" accessibilityLabel="Elimina" onPress={remove} />
 * <IconButton icon={Plus} variant="solid" color="primary" shape="circle" accessibilityLabel="Nuovo" />
 * ```
 */
export function IconButton(props: IconButtonProps) {
  const themeDefaults = useComponentDefaults('IconButton');
  const tokens = useComponentTokens('IconButton');

  const {
    icon: Icon,
    accessibilityLabel,
    variant = 'ghost',
    color = 'secondary',
    size = 'md',
    shape = 'square',
    loading = false,
    disabled = false,
    access,
    visibleWhen,
    sx,
    ...rest
  } = { ...themeDefaults, ...props } as IconButtonProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (__DEV__ && !accessibilityLabel) {
    console.warn(
      '[@dashforge/rn] <IconButton> has no accessibilityLabel, so it announces itself ' +
        'as "button" and nothing else. An icon is the affordance, not the name: say what ' +
        'the button does.',
    );
  }

  if (!isVisible || !accessState.visible) return null;

  const resolve = iconButtonRecipe(tokens);
  // No read-only rendering of its own: a button you can see but not
  // press is a disabled button. Same collapse as Button.
  const inactive =
    disabled || loading || accessState.disabled || accessState.readonly;
  const iconSize = tokens.iconSize[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={tokens.hitSlop[size]}
      {...rest}
      style={({ pressed }) => {
        // `loading` resolves to `rest`, not `disabled`: the button keeps
        // its colour while busy, since dimming would say "you cannot",
        // which is a different message from "wait".
        const state = disabled ? 'disabled' : pressed && !loading ? 'pressed' : 'rest';
        const styles = resolve({ variant, color, size, shape, state });
        const pressState: DashPressState = {
          pressed,
          focused: false,
          disabled: inactive,
        };
        return [styles.root, typeof sx === 'function' ? sx(pressState) : sx];
      }}
    >
      {({ pressed }) => {
        const state = disabled ? 'disabled' : pressed && !loading ? 'pressed' : 'rest';
        const styles = resolve({ variant, color, size, shape, state });
        // `ColorValue` admits null and the platform's opaque colour
        // objects; icon components take a plain string. Our tokens only
        // ever produce strings, so anything else means a consumer put
        // something exotic in the role and the icon inherits instead.
        const tint = typeof styles.icon.color === 'string' ? styles.icon.color : undefined;

        return loading ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Icon size={iconSize} color={tint} />
        );
      }}
    </Pressable>
  );
}
