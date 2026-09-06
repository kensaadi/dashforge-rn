import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { buttonRecipe } from './button.variants';
import type { ButtonProps, DashPressState } from './button.types';

/**
 * The action component.
 *
 * Every visual decision is a prop resolved against tokens; `sx` exists
 * for the case the prop surface does not cover and should be rare.
 *
 * `sx` is flat rather than a slot map because a Button reads as one
 * thing: the label's type comes from `theme.components.Button.tokens.typography`
 * and its colour from the `color` role, which is the right level to
 * change either. If a genuine need for per-part overrides appears, slots
 * are additive.
 *
 * @example
 * ```tsx
 * <Button onPress={save}>Salva</Button>
 * <Button variant="outline" color="danger" size="lg">Elimina</Button>
 * <Button startIcon={Plus} fullWidth loading={saving}>Nuovo progetto</Button>
 * ```
 */
export function Button(props: ButtonProps) {
  const themeDefaults = useComponentDefaults('Button');
  const tokens = useComponentTokens('Button');

  const {
    access,
    visibleWhen,
    children,
    variant = 'solid',
    color = 'primary',
    size = 'md',
    radius = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    startIcon: StartIcon,
    endIcon: EndIcon,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins. This is the props lane of section 9.
  } = { ...themeDefaults, ...props } as ButtonProps;

  // Both hooks run unconditionally, above every early return. They are
  // cheap when the props are absent (no provider, no form, no work) and
  // the alternative is a conditional hook.
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  // Two ways to be hidden, and they are different questions: RBAC asks
  // whether this person may see it, `visibleWhen` asks whether the form
  // is in a state where it applies.
  if (!isVisible || !accessState.visible) return null;

  const resolve = buttonRecipe(tokens);
  // A Button has no read-only state to render, so RBAC's `'readonly'`
  // resolves to disabled here. Same mapping as the other two renderers.
  const inactive = disabled || loading || accessState.disabled || accessState.readonly;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={tokens.hitSlop[size]}
      {...rest}
      style={({ pressed }) => {
        // `loading` deliberately resolves to `rest`, not `disabled`: the
        // button keeps its full colour while busy. Dimming would say
        // "you cannot", which is a different message.
        const state = disabled ? 'disabled' : pressed && !loading ? 'pressed' : 'rest';
        const styles = resolve({ variant, color, size, radius, state, fullWidth });
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
        const styles = resolve({ variant, color, size, radius, state, fullWidth });
        // `ColorValue` admits null and the platform's opaque colour
        // objects; icon components take a plain string. Our tokens only
        // ever produce strings, so anything else means a consumer put
        // something exotic in `typography` and the icon falls back to
        // inheriting.
        const labelColor = styles.label.color;
        const iconColor = typeof labelColor === 'string' ? labelColor : undefined;
        const iconSize = tokens.iconSize[size];

        return (
          <>
            {loading ? (
              // Takes the leading icon's place rather than adding to it,
              // so the button does not change width mid-interaction.
              <ActivityIndicator size="small" color={iconColor} />
            ) : StartIcon ? (
              <StartIcon size={iconSize} color={iconColor} />
            ) : null}

            {children !== undefined && children !== null ? (
              // Wrapped unconditionally: a bare string inside a View is a
              // crash on React Native, not a layout quirk.
              <Text
                style={styles.label}
                maxFontSizeMultiplier={tokens.typography.maxFontSizeMultiplier}
              >
                {children}
              </Text>
            ) : null}

            {EndIcon ? <EndIcon size={iconSize} color={iconColor} /> : null}
          </>
        );
      }}
    </Pressable>
  );
}
