import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { TabsTokens } from '../../tokens/components';
import type { TabsListProps } from './tabs.types';

/** The parts Tabs paints. */
export interface TabsSlotStyles {
  /** The strip, which carries the rail along its bottom edge. */
  list: ViewStyle;
  /** The row of tabs inside the strip. */
  row: ViewStyle;
  /** One tab. */
  tab: ViewStyle;
  label: TextStyle;
  /** The mark that travels. */
  indicator: ViewStyle;
}

export interface TabsVariantSelection {
  variant?: TabsListProps['variant'];
  /** Internal: the state of one tab, not a prop on the list. */
  state?: 'rest' | 'selected' | 'disabled';
  pressed?: boolean;
}

/**
 * The Tabs recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const tabsRecipe: (
  tokens: TabsTokens,
) => (props?: TabsVariantSelection) => TabsSlotStyles = createRecipe(
  (t: TabsTokens) =>
    svSlots({
      slots: {
        list: {
          // The rail is a border and not a child: it has to run the full
          // width of the strip and stay put while the tabs scroll under
          // it, and a child inside the scrolling row would travel.
          borderBottomWidth: t.rail.thickness,
          borderBottomColor: t.rail.color,
        } as ViewStyle,
        row: { flexDirection: 'row' } as ViewStyle,
        tab: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.tabGap,
          // `minHeight` and never `height`: a tab grows when the user's
          // text-size setting demands it instead of clipping its word.
          minHeight: t.minHeight,
          paddingHorizontal: t.paddingHorizontal,
        } as ViewStyle,
        label: {
          ...resolveTypeStyle(t.typography.label),
          color: t.color.label,
        } as TextStyle,
        indicator: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: t.indicator.thickness,
          borderRadius: t.indicator.radius,
          backgroundColor: t.color.indicator,
        } as ViewStyle,
      },
      variants: {
        variant: {
          // Equal shares of the width. `flex: 1` on the tab is what
          // divides it; the row only has to fill the strip.
          fitted: { row: { alignSelf: 'stretch' }, tab: { flex: 1 } },
          // Natural widths, and the row is as wide as its contents so
          // the scroll view has something longer than itself to scroll.
          scrollable: {},
        },
        state: {
          rest: {},
          selected: { label: { color: t.color.labelSelected } },
          disabled: { label: { color: t.color.labelDisabled } },
        },
        pressed: {
          true: { tab: { backgroundColor: t.color.bgPressed } },
          false: {},
        },
      },
      defaultVariants: { variant: 'fitted', state: 'rest', pressed: false },
    }),
);
