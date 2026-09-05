import { createContext, useContext } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { cardRecipe } from './card.variants';
import type {
  CardCoverProps,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardProps,
} from './card.types';

/**
 * What a card tells its own parts.
 *
 * `Card.Media` needs the inset it has to escape, since a band that
 * stopped at the card's padding would not be a band. `Card.Header` needs
 * the tone, because a tint recolours the text that sits on it and the
 * header is the component that draws that text.
 */
const CardContext = createContext<{
  padding: number;
  radius: number;
  tone: NonNullable<CardProps['tone']>;
  /** True inside a `Card.Cover`, where the text stops following the mode. */
  over: 'card' | 'cover';
}>({ padding: 0, radius: 0, tone: 'neutral', over: 'card' });

/**
 * A full-width image band inside a card.
 *
 * Above the content rather than behind it, which is what most cards
 * actually want and what keeps the text on its own ground: contrast
 * against a photograph arriving from a CDN is not something this library
 * can promise, and a band avoids having to.
 *
 * The image is clipped, not the card. Rounding the card would need
 * `overflow: 'hidden'`, and that removes the shadow of an `elevated`
 * card on iOS while Android keeps drawing it, since `elevation` is a
 * property of the view rather than a painted edge.
 *
 * @example
 * ```tsx
 * <Card padding="md">
 *   <Card.Media source={{ uri: product.image }} />
 *   <Card.Header title={product.name} subtitle={product.price} />
 * </Card>
 * ```
 */
export function CardMedia(props: CardMediaProps) {
  const { padding, radius } = useContext(CardContext);
  const {
    source,
    aspectRatio = 16 / 9,
    height,
    resizeMode = 'cover',
    flush = 'top',
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
  } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const toTheEdge = flush === 'top' || flush === 'all';
  const toTheBottom = flush === 'all';

  return (
    // The bleed is the wrapper's job, not the image's.
    //
    // An `Image` reports the intrinsic size of what it loaded, and Yoga
    // uses that when the width is left to work itself out, so an image
    // laid out by negative margins alone ended up wider than the card and
    // ran off its right edge. A `View` has no intrinsic size to argue
    // with: it takes the card's content box, the negative margins push it
    // out to the edges from there, and the image fills it at exactly
    // 100%.
    //
    // The wrapper also owns the clipping, which is what makes the corner
    // safe: `overflow: 'hidden'` here cannot reach the card, so an
    // elevated card keeps the shadow it would have lost.
    <View
      style={{
        marginHorizontal: -padding,
        marginTop: toTheEdge ? -padding : 0,
        marginBottom: toTheBottom ? -padding : 0,
        borderTopLeftRadius: toTheEdge ? radius : 0,
        borderTopRightRadius: toTheEdge ? radius : 0,
        borderBottomLeftRadius: toTheBottom ? radius : 0,
        borderBottomRightRadius: toTheBottom ? radius : 0,
        overflow: 'hidden',
      }}
    >
      <Image
        source={source}
        resizeMode={resizeMode}
        // Announced only when it was given something to say. A photograph
        // beside a title that already names it is decoration, and the
        // right outcome for decoration is to be skipped.
        accessible={Boolean(accessibilityLabel)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityLabel ? 'image' : undefined}
        importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
        {...rest}
        style={[
          {
            width: '100%',
            height,
            aspectRatio: height === undefined ? aspectRatio : undefined,
          },
          sx,
        ]}
      />
    </View>
  );
}
CardMedia.displayName = 'Card.Media';

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
  const { tone, over } = useContext(CardContext);
  const { title, subtitle, action, children, access, visibleWhen, sx, ...rest } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  // Resolved with the card's tone, not with the default: on a tinted
  // ground the text moves with the tint, and muted neutral text there was
  // never checked for contrast against it.
  const styles = cardRecipe(tokens)({ tone, over });

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

/** Below this a flat veil stops guaranteeing that white text can be read. */
const SCRIM_FLOOR = 0.3;

const COVER_ALIGN = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
} as const;

/**
 * The card as a picture, with the words on top of it.
 *
 * The opposite trade from `Card.Media`, and the reason it is a separate
 * component rather than a prop: a band puts the text on its own ground
 * and has nothing to promise, while a cover puts it on a photograph and
 * has to.
 *
 * Two things are therefore not the caller's to get wrong. The veil
 * between image and text belongs to the component, because contrast
 * against pixels arriving from a CDN cannot be measured here and cannot
 * be measured by the caller either. And the text over it stops following
 * the light and dark modes: a photograph does not invert with the theme,
 * so neither can the words on it.
 *
 * The veil is flat rather than a gradient. A gradient would want a
 * dependency and this library ships three; flat is less pretty and
 * always correct, which is the right trade for the thing that decides
 * whether the words can be read at all.
 *
 * @example
 * ```tsx
 * <Card padding="none" onPress={open} accessibilityLabel="Apri la guida">
 *   <Card.Cover source={{ uri: article.hero }} minHeight={220}>
 *     <Card.Header title="Dove finisce la luce" subtitle="8 minuti" />
 *   </Card.Cover>
 * </Card>
 * ```
 */
export function CardCover(props: CardCoverProps) {
  const tokens = useComponentTokens('Card');
  const outer = useContext(CardContext);
  const {
    source,
    children,
    minHeight = 180,
    align = 'bottom',
    scrim = 0.5,
    resizeMode = 'cover',
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
  } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (__DEV__ && scrim < SCRIM_FLOOR) {
    console.warn(
      `[@dashforge/rn] <Card.Cover> has scrim=${scrim}, below the ${SCRIM_FLOOR} at which ` +
        'white text stops being legible over a light image. The text will read on some ' +
        'pictures and vanish on others, and which ones is not something this component ' +
        'can know.',
    );
  }

  if (!isVisible || !accessState.visible) return null;

  return (
    // The cover is the whole card, so it bleeds on every side and takes
    // the card's corners. It carries the padding itself, which is what
    // keeps the text inset whether the card was given padding or none.
    <View
      {...rest}
      style={[
        {
          marginHorizontal: -outer.padding,
          marginVertical: -outer.padding,
          borderRadius: outer.radius,
          overflow: 'hidden',
          minHeight,
          padding: outer.padding === 0 ? tokens.padding.md : outer.padding,
          justifyContent: COVER_ALIGN[align],
        },
        sx,
      ]}
    >
      <Image
        source={source}
        resizeMode={resizeMode}
        accessible={Boolean(accessibilityLabel)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityLabel ? 'image' : undefined}
        importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tokens.color.scrim, opacity: scrim },
        ]}
      />
      <CardContext.Provider value={{ ...outer, padding: 0, over: 'cover' }}>
        {children}
      </CardContext.Provider>
    </View>
  );
}
CardCover.displayName = 'Card.Cover';

/**
 * The card's call to action, at the bottom.
 *
 * Distinct from `Card.Header`'s `action`, which is a slot beside the
 * title for a price, a "see all", an overflow menu. What the card is
 * asking the user to do belongs down here, after what it is asking about.
 *
 * `align="stack"` puts the actions one above the other, which is the
 * shape a phone wants when the card asks for one thing; the default puts
 * them at the end, where a confirm lands on both platforms.
 *
 * Stacking decides the direction and not the width. A `Button` that is
 * not `fullWidth` states `alignSelf` for itself and beats the footer's
 * `alignItems`, which is the right way round, so a full-width action is
 * written `<Button fullWidth>`.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header title="Elimina il progetto" subtitle="Non si torna indietro" />
 *   <Card.Footer divider>
 *     <Button variant="ghost" color="secondary">Annulla</Button>
 *     <Button color="danger">Elimina</Button>
 *   </Card.Footer>
 * </Card>
 * ```
 */
export function CardFooter(props: CardFooterProps) {
  const tokens = useComponentTokens('Card');
  const { padding } = useContext(CardContext);
  const {
    children,
    align = 'end',
    divider = false,
    access,
    visibleWhen,
    sx,
    ...rest
  } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const styles = cardRecipe(tokens)({ align });

  return (
    <>
      {divider ? (
        // Across the whole card rather than inside its padding: a rule
        // that stops short of the edges reads as decoration, not as a
        // boundary between two regions.
        <View
          style={{
            marginHorizontal: -padding,
            height: StyleSheet.hairlineWidth,
            backgroundColor: tokens.color.divider,
          }}
        />
      ) : null}
      <View {...rest} style={[styles.footer, sx]}>
        {children}
      </View>
    </>
  );
}
CardFooter.displayName = 'Card.Footer';

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
    tone = 'neutral',
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

  const inset = padding === 'none' ? 0 : tokens.padding[padding as 'sm' | 'md' | 'lg'];
  // The radius a child sees is the card's less its border, or a band
  // tucked into the corner draws a second curve inside the first.
  // The border the card actually draws, which is not the token unless
  // the variant asked for an edge. Subtracting it unconditionally left an
  // elevated card rounded a point more than the band inside it, and that
  // point of ground showing through the corner is what reads as the image
  // spilling out.
  const edge = variant === 'outlined' ? tokens.borderWidth : 0;
  const inner = {
    padding: inset,
    radius: Math.max(tokens.radius - edge, 0),
    tone,
    over: 'card' as const,
  };

  if (!interactive) {
    return (
      <CardContext.Provider value={inner}>
        <View {...rest} style={[resolve({ variant, tone, padding }).root, sx]}>
          {children}
        </View>
      </CardContext.Provider>
    );
  }

  return (
    <CardContext.Provider value={inner}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive }}
        disabled={inactive}
        onPress={onPress}
        onLongPress={onLongPress}
        {...rest}
        style={({ pressed }) => [
          resolve({ variant, tone, padding, pressed: pressed && !inactive }).root,
          // The ground moves too, but a card can have its ground covered
          // by an image, and then there is nothing chromatic left to say:
          // a promo banner is one picture and a tap target, and a colour
          // it never shows is not feedback. Shrinking works over
          // anything, in both modes. Instant rather than animated,
          // because it is tied to the finger and not played at the user.
          pressed && !inactive ? { transform: [{ scale: tokens.pressScale }] } : null,
          // Dimming means "unavailable" and nothing else, which is why it
          // is the only opacity token there is. A press is a colour change
          // or a shift, never a fade.
          inactive ? { opacity: theme.semantic.opacity.disabled } : null,
          sx,
        ]}
      >
        {children}
      </Pressable>
    </CardContext.Provider>
  );
}

Card.Header = CardHeader;
Card.Media = CardMedia;
Card.Footer = CardFooter;
Card.Cover = CardCover;
