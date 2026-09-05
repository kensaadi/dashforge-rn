import { Pressable, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { cardRecipe } from './card.variants';
import type { CardHeaderProps, CardProps } from './card.types';

/**
 * A card's heading block.
 *
 * `title` and `subtitle` exist as props rather than as content because
 * the layout around them is the part that gets written wrong: the text
 * block has to take the width and wrap, while a trailing action stays
 * put at the top instead of drifting down when the title runs to two
 * lines.
 *
 * Either may be a node instead of a string when the scale does not cover
 * the case, and then nothing is styled for you.
 *
 * @example
 * ```tsx
 * <Card.Header title="Ordini recenti" subtitle="Ultimi 30 giorni" />
 * <Card.Header title="Fattura 2024-118" action={<Button variant="ghost">Apri</Button>} />
 * ```
 */
export function CardHeader(props: CardHeaderProps) {
  const tokens = useComponentTokens('Card');
  const { title, subtitle, action, children, access, visibleWhen, sx, ...rest } =
    props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const styles = cardRecipe(tokens)();

  return (
    <View {...rest} style={[styles.header, sx?.header]}>
      <View style={styles.headerBody}>
        {typeof title === 'string' ? (
          // Announced as a heading, so heading navigation works. A node
          // is left alone: the caller has taken the decision over.
          <Text accessibilityRole="header" style={[styles.title, sx?.title]}>
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Text style={[styles.subtitle, sx?.subtitle]}>{subtitle}</Text>
        ) : (
          subtitle
        )}
        {children}
      </View>
      {action}
    </View>
  );
}
CardHeader.displayName = 'Card.Header';

/**
 * A surface that groups content.
 *
 * The default is `outlined`, because the language here is flat and
 * bordered. An edge costs nothing to read, survives any background, and
 * does not compete with what is inside. `elevated` is the exception, not
 * the norm: shadows read poorly on a dark ground, which is why the dark
 * theme carries more opacity for the same step and why separation there
 * comes mostly from surface lightness.
 *
 * A card is a column with a gap, because every one written by hand
 * before this component existed set exactly that.
 *
 * **On `elevated` and clipping.** A shadow is drawn outside the view's
 * bounds, so an ancestor with `overflow: 'hidden'` removes it on iOS
 * while Android keeps drawing it, since `elevation` is a property of the
 * view rather than a painted edge. Rounding a full-bleed image inside an
 * elevated card is the usual way to meet this: clip the image, not the
 * card.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header title="Ordini recenti" subtitle="Ultimi 30 giorni" />
 *   <OrderList />
 * </Card>
 *
 * <Card variant="elevated" onPress={open} accessibilityLabel="Apri la fattura">
 *   <Card.Header title="Fattura 2024-118" subtitle="Scade il 12 marzo" />
 * </Card>
 * ```
 */
export function Card(props: CardProps) {
  const themeDefaults = useComponentDefaults('Card');
  const tokens = useComponentTokens('Card');
  const theme = useTheme();

  const {
    children,
    variant = 'outlined',
    padding = 'md',
    onPress,
    onLongPress,
    disabled = false,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as CardProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const resolve = cardRecipe(tokens);
  // A card has nothing to be read-only about: it holds content, it does
  // not take a value. RBAC's `'readonly'` therefore only means anything
  // when the card is pressable, where it lands on inert like `'disable'`.
  const interactive = Boolean(onPress || onLongPress);
  const inactive = disabled || accessState.disabled || accessState.readonly;

  if (!interactive) {
    return (
      <View {...rest} style={[resolve({ variant, padding }).root, sx?.root]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      onLongPress={onLongPress}
      {...rest}
      style={({ pressed }) => [
        resolve({ variant, padding, pressed: pressed && !inactive }).root,
        // Dimming means "unavailable" and nothing else, which is why it
        // is the only opacity token there is. A press is a colour change,
        // never a fade.
        inactive ? { opacity: theme.semantic.opacity.disabled } : null,
        sx?.root,
      ]}
    >
      {children}
    </Pressable>
  );
}

Card.Header = CardHeader;
