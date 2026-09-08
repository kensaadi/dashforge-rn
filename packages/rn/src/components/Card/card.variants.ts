import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { CardTokens, CardTone, RadiusStep } from '../../tokens/components';
import type { CardFooterProps, CardProps } from './card.types';

/** The parts a Card paints. */
export interface CardSlotStyles {
  root: ViewStyle;
  /** The row of actions at the bottom. */
  footer: ViewStyle;
  header: ViewStyle;
  /** The title and subtitle block, so a long title wraps before the action. */
  headerBody: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
}

/** The axes the recipe resolves on. `pressed` is internal, not a public prop. */
export interface CardVariantSelection {
  radius?: RadiusStep;
  variant?: CardProps['variant'];
  tone?: CardProps['tone'];
  padding?: CardProps['padding'];
  pressed?: boolean;
  over?: 'card' | 'cover';
  align?: CardFooterProps['align'];
}

const TONES: CardTone[] = ['success', 'warning', 'danger', 'info'];

/**
 * The Card recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * The three variants differ in one decision each: `outlined` draws an
 * edge, `elevated` casts a shadow, `filled` changes ground. None of them
 * combines two, because a card that is bordered *and* raised is saying
 * the same thing twice and the shadow is what loses.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const cardRecipe: (
  tokens: CardTokens,
) => (props?: CardVariantSelection) => CardSlotStyles = createRecipe(
  (t: CardTokens) => {
    // Written out rather than generated: a spread of computed keys erases
    // the literal key types, and the axis would then only know `neutral`.
    const tinted = (tone: CardTone) => ({
      root: { backgroundColor: t.tone[tone].bg, borderColor: t.tone[tone].border },
      title: { color: t.tone[tone].fg },
      subtitle: { color: t.tone[tone].fg },
    });

    return svSlots({
      slots: {
        root: {
          // A card is a stack. Every one built by hand so far set this
          // and a gap, so it is the default rather than a variant.
          flexDirection: 'column',
          gap: t.gap,
        } as ViewStyle,
        header: {
          flexDirection: 'row',
          // Top rather than centre: a one-line action must not drift
          // down when the title wraps onto a second line.
          alignItems: 'flex-start',
          gap: t.gap,
        } as ViewStyle,
        headerBody: { flex: 1, gap: 2 } as ViewStyle,
        footer: { gap: t.gap, alignItems: 'center' } as ViewStyle,
        title: {
          ...resolveTypeStyle(t.typography.title),
          color: t.color.title,
        } as TextStyle,
        subtitle: {
          ...resolveTypeStyle(t.typography.subtitle),
          color: t.color.subtitle,
        } as TextStyle,
      },
      variants: {
        // Roundness as a prop, named from the scale. Arbitrary numbers
        // still go through `sx`: a step with a name is the design system,
        // a number is stepping outside it.
        radius: {
          none: { root: { borderRadius: t.radius.none } },
          sm: { root: { borderRadius: t.radius.sm } },
          md: { root: { borderRadius: t.radius.md } },
          lg: { root: { borderRadius: t.radius.lg } },
          xl: { root: { borderRadius: t.radius.xl } },
          '2xl': { root: { borderRadius: t.radius['2xl'] } },
          full: { root: { borderRadius: t.radius.full } },
        },
        variant: {
          outlined: {
            root: {
              backgroundColor: t.color.bg,
              borderWidth: t.borderWidth,
              borderColor: t.color.border,
            },
          },
          elevated: {
            root: { backgroundColor: t.color.bg, ...t.elevation },
          },
          filled: {
            root: { backgroundColor: t.color.bgFilled },
          },
        },
        padding: {
          none: { root: { padding: 0 } },
          sm: { root: { padding: t.padding.sm } },
          md: { root: { padding: t.padding.md } },
          lg: { root: { padding: t.padding.lg } },
        },
        tone: {
          neutral: {},
          // A tone recolours the ground and the text with it. Whether
          // there is an edge at all is still the variant's decision, so
          // the border *colour* is set here and its width is not.
          success: tinted('success'),
          warning: tinted('warning'),
          danger: tinted('danger'),
          info: tinted('info'),
        },
        pressed: { true: {}, false: {} },
        // Where the heading sits. Over a cover image the text colours
        // stop following the mode, because a photograph does not invert
        // with the theme and neither can the words on it.
        over: {
          card: {},
          cover: {
            title: { color: t.color.onCover },
            subtitle: { color: t.color.onCoverMuted },
          },
        },
        align: {
          start: { footer: { flexDirection: 'row', justifyContent: 'flex-start' } },
          end: { footer: { flexDirection: 'row', justifyContent: 'flex-end' } },
          between: {
            footer: { flexDirection: 'row', justifyContent: 'space-between' },
          },
          // One above the other. `alignItems: stretch` fills whatever
          // does not opt out, but the footer promises the direction and
          // nothing more: a `Button` states its own `alignSelf` and wins,
          // so a full-width action is `<Button fullWidth>`.
          stack: { footer: { flexDirection: 'column', alignItems: 'stretch' } },
        },
      },
      compoundVariants: [
        ...TONES.map((tone) => ({
          tone,
          pressed: true,
          style: { root: { backgroundColor: t.tone[tone].bgPressed } },
        })),
        {
          variant: 'outlined',
          tone: 'neutral',
          pressed: true,
          style: { root: { backgroundColor: t.color.bgPressed } },
        },
        {
          variant: 'elevated',
          tone: 'neutral',
          pressed: true,
          style: { root: { backgroundColor: t.color.bgPressed } },
        },
        {
          variant: 'filled',
          tone: 'neutral',
          pressed: true,
          style: { root: { backgroundColor: t.color.bgFilledPressed } },
        },
      ],
      defaultVariants: {
        // A card is softer than its contents, which is why its step is
        // one above a control's.
        radius: 'lg',
        variant: 'outlined',
        tone: 'neutral',
        padding: 'md',
        pressed: false,
      },
    });
  },
);
