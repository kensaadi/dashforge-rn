import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { ActionColor, BadgeTokens } from '../../tokens/components';
import type { BadgeProps } from './badge.types';

/** The parts a Badge paints. */
export interface BadgeSlotStyles {
  root: ViewStyle;
  label: TextStyle;
}

export interface BadgeVariantSelection {
  color?: ActionColor;
  variant?: BadgeProps['variant'];
  dot?: boolean;
}

const COLORS: ActionColor[] = ['primary', 'secondary', 'danger', 'success', 'warning'];

/**
 * The Badge recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const badgeRecipe: (
  tokens: BadgeTokens,
) => (props?: BadgeVariantSelection) => BadgeSlotStyles = createRecipe(
  (t: BadgeTokens) =>
    svSlots({
      slots: {
        root: {
          alignItems: 'center',
          justifyContent: 'center',
          // `center` and not `flex-start`.
          //
          // It has to state something, or a badge dropped into a column
          // stretches to the full width under React Native's default
          // `alignItems: 'stretch'`. `flex-start` stopped that and
          // introduced a worse one: a child's `alignSelf` beats its
          // parent's `alignItems`, so in a **row** it pinned the badge
          // to the top and it floated above the words beside it. That is
          // every trailing slot and every tab, which is where a badge
          // actually lives. Found by looking at a tab strip.
          alignSelf: 'center',
          borderRadius: t.radius,
        } as ViewStyle,
        label: {
          ...resolveTypeStyle(t.typography.label),
          // Never wraps and never grows the pill past one line: a badge
          // that reflowed would move whatever it is sitting next to.
          includeFontPadding: false,
        } as TextStyle,
      },
      variants: {
        color: Object.fromEntries(COLORS.map((c) => [c, {}])) as Record<ActionColor, object>,
        variant: { solid: {}, soft: {} },
        dot: {
          true: { root: { width: t.dotSize, height: t.dotSize } },
          false: {
            root: {
              height: t.height,
              minWidth: t.minWidth,
              paddingHorizontal: t.paddingHorizontal,
            },
          },
        },
      },
      compoundVariants: COLORS.flatMap((color) => [
        {
          color,
          variant: 'solid' as const,
          style: {
            root: { backgroundColor: t.tone[color].solidBg },
            label: { color: t.tone[color].solidFg },
          },
        },
        {
          color,
          variant: 'soft' as const,
          style: {
            root: { backgroundColor: t.tone[color].softBg },
            label: { color: t.tone[color].softFg },
          },
        },
      ]),
      defaultVariants: { color: 'primary', variant: 'solid', dot: false },
    }),
);
