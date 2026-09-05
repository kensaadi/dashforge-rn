import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { CardTokens } from '../../tokens/components';
import type { CardProps } from './card.types';

/** The parts a Card paints. */
export interface CardSlotStyles {
  root: ViewStyle;
  header: ViewStyle;
  /** The title and subtitle block, so a long title wraps before the action. */
  headerBody: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
}

/** The axes the recipe resolves on. `pressed` is internal, not a public prop. */
export interface CardVariantSelection {
  variant?: CardProps['variant'];
  padding?: CardProps['padding'];
  pressed?: boolean;
}

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
  (t: CardTokens) =>
    svSlots({
      slots: {
        root: {
          borderRadius: t.radius,
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
        pressed: { true: {}, false: {} },
      },
      compoundVariants: [
        {
          variant: 'outlined',
          pressed: true,
          style: { root: { backgroundColor: t.color.bgPressed } },
        },
        {
          variant: 'elevated',
          pressed: true,
          style: { root: { backgroundColor: t.color.bgPressed } },
        },
        {
          variant: 'filled',
          pressed: true,
          style: { root: { backgroundColor: t.color.bgFilledPressed } },
        },
      ],
      defaultVariants: { variant: 'outlined', padding: 'md', pressed: false },
    }),
);
