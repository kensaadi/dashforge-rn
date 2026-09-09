import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { ListItemTokens } from '../../tokens/components';
import type { ListDivider } from './listItem.types';

/** The parts a row paints. */
export interface ListItemSlotStyles {
  root: ViewStyle;
  leading: ViewStyle;
  /** The title and subtitle block, which is what takes the leftover width. */
  body: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  value: TextStyle;
  /** The hairline above the row. */
  separator: ViewStyle;
  /** Two edges of a square, turned, which is the whole chevron. */
  chevron: ViewStyle;
}

/** `pressed` is internal, not a public prop. */
export interface ListItemVariantSelection {
  pressed?: boolean;
  divider?: ListDivider;
}

/**
 * The ListItem recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const listItemRecipe: (
  tokens: ListItemTokens,
) => (props?: ListItemVariantSelection) => ListItemSlotStyles = createRecipe(
  (t: ListItemTokens) =>
    svSlots({
      slots: {
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.gap,
          // `minHeight` and never `height`: a row grows when the user's
          // text-size setting demands it instead of clipping its title.
          minHeight: t.minHeight,
          paddingVertical: t.paddingVertical,
          paddingHorizontal: t.paddingHorizontal,
          backgroundColor: t.color.bg,
        } as ViewStyle,
        // Centred on its own, so an icon shorter than two lines of text
        // sits against the middle of the block rather than the top.
        leading: { alignItems: 'center', justifyContent: 'center' } as ViewStyle,
        body: { flex: 1, gap: t.titleGap } as ViewStyle,
        title: {
          ...resolveTypeStyle(t.typography.title),
          color: t.color.title,
        } as TextStyle,
        subtitle: {
          ...resolveTypeStyle(t.typography.subtitle),
          color: t.color.subtitle,
        } as TextStyle,
        value: {
          ...resolveTypeStyle(t.typography.value),
          color: t.color.value,
          // The value gives way before the title does: "Italiano" can
          // shorten, the name of the setting has to stay readable.
          flexShrink: 1,
          textAlign: 'right',
        } as TextStyle,
        separator: {
          position: 'absolute',
          top: 0,
          right: 0,
          height: t.separator.thickness,
          backgroundColor: t.separator.color,
        } as ViewStyle,
        chevron: {
          width: t.chevron.size,
          height: t.chevron.size,
          borderRightWidth: t.chevron.thickness,
          borderTopWidth: t.chevron.thickness,
          borderColor: t.color.chevron,
          // Turned so the corner points the way the row goes.
          transform: [{ rotate: '45deg' }],
        } as ViewStyle,
      },
      variants: {
        pressed: {
          true: { root: { backgroundColor: t.color.bgPressed } },
          false: {},
        },
        // Where the hairline starts. `none` gives it no width at all
        // rather than no colour, so it cannot be seen through a tint.
        divider: {
          none: { separator: { left: 0, width: 0 } },
          full: { separator: { left: 0 } },
          inset: { separator: { left: t.separator.inset } },
        },
      },
      defaultVariants: { pressed: false, divider: 'none' },
    }),
);
