import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { EmptyStateTokens } from '../../tokens/components';

/** The parts an EmptyState paints. */
export interface EmptyStateSlotStyles {
  root: ViewStyle;
  body: ViewStyle;
  title: TextStyle;
  description: TextStyle;
}

export interface EmptyStateVariantSelection {
  fill?: boolean;
}

/**
 * The EmptyState recipe.
 *
 * The tone is not an axis here. It reaches one colour on one icon, and a
 * variant per tone would compile five combinations to say that.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const emptyStateRecipe: (
  tokens: EmptyStateTokens,
) => (props?: EmptyStateVariantSelection) => EmptyStateSlotStyles = createRecipe(
  (t: EmptyStateTokens) =>
    svSlots({
      slots: {
        root: {
          alignItems: 'center',
          gap: t.gap,
          padding: t.padding,
        } as ViewStyle,
        body: {
          alignItems: 'center',
          gap: 4,
          maxWidth: t.maxWidth,
        } as ViewStyle,
        title: {
          ...resolveTypeStyle(t.typography.title),
          color: t.color.title,
          textAlign: 'center',
        } as TextStyle,
        description: {
          ...resolveTypeStyle(t.typography.description),
          color: t.color.description,
          textAlign: 'center',
        } as TextStyle,
      },
      variants: {
        fill: {
          // Takes the space it was given and sits in the middle of it.
          // Only useful when the parent has space to give, which is why
          // it is a prop and not the default.
          true: { root: { flex: 1, justifyContent: 'center' } },
          false: {},
        },
      },
      defaultVariants: { fill: false },
    }),
);
