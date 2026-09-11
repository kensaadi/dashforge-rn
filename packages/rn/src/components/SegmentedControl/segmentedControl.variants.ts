import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { SegmentedControlTokens } from '../../tokens/components';
import type { SegmentedControlProps } from './segmentedControl.types';

/** The parts a SegmentedControl paints. */
export interface SegmentedControlSlotStyles {
  root: ViewStyle;
  label: TextStyle;
  track: ViewStyle;
  thumb: ViewStyle;
  segment: ViewStyle;
  segmentLabel: TextStyle;
  helper: TextStyle;
}

export interface SegmentedControlVariantSelection {
  size?: SegmentedControlProps['size'];
  invalid?: boolean;
  disabled?: boolean;
  /** Internal: the state of one segment, not a prop on the group. */
  state?: 'rest' | 'selected' | 'disabled';
}

const SIZES = ['sm', 'md', 'lg'] as const;

/**
 * The SegmentedControl recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const segmentedControlRecipe: (
  tokens: SegmentedControlTokens,
) => (props?: SegmentedControlVariantSelection) => SegmentedControlSlotStyles = createRecipe(
  (t: SegmentedControlTokens) =>
    svSlots({
      slots: {
        root: { gap: t.gap } as ViewStyle,
        label: {
          ...resolveTypeStyle(t.typography.groupLabel),
          color: t.color.groupLabel,
        } as TextStyle,
        track: {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: t.color.track,
          borderRadius: t.radius,
          padding: t.inset,
          // Clipped, so the thumb cannot escape the rounded track on
          // the frame where a rounding error makes it a point too wide.
          overflow: 'hidden',
        } as ViewStyle,
        thumb: {
          position: 'absolute',
          top: t.inset,
          bottom: t.inset,
          left: 0,
          backgroundColor: t.color.thumb,
          // The track's corners less the inset, so the two curves are
          // concentric instead of one sitting inside a tighter one.
          borderRadius: Math.max(t.radius - t.inset, 0),
          ...t.elevation,
        } as ViewStyle,
        segment: {
          // Equal shares, which is what makes the thumb's width a
          // division and not a measurement.
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        } as ViewStyle,
        segmentLabel: {
          ...resolveTypeStyle(t.typography.label),
          color: t.color.label,
        } as TextStyle,
        helper: {
          ...resolveTypeStyle(t.typography.helper),
          color: t.color.helper,
        } as TextStyle,
      },
      variants: {
        size: Object.fromEntries(
          SIZES.map((step) => [
            step,
            // `minHeight` and never `height`: the strip grows when the
            // user's text-size setting demands it instead of clipping
            // its words.
            { track: { minHeight: t.height[step] } },
          ]),
        ) as Record<'sm' | 'md' | 'lg', { track: ViewStyle }>,
        invalid: {
          true: {
            track: { borderWidth: 1, borderColor: t.color.borderInvalid },
            helper: { color: t.color.helperInvalid },
          },
          false: {},
        },
        disabled: {
          true: { track: { backgroundColor: t.color.trackDisabled } },
          false: {},
        },
        state: {
          rest: {},
          selected: { segmentLabel: { color: t.color.labelSelected } },
          disabled: { segmentLabel: { color: t.color.labelDisabled } },
        },
      },
      defaultVariants: {
        size: 'md',
        invalid: false,
        disabled: false,
        state: 'rest',
      },
    }),
);
