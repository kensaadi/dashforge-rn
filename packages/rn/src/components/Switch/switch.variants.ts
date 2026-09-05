import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { SwitchTokens } from '../../tokens/components';
import type { SwitchProps } from './switch.types';

/** The parts a Switch paints. */
export interface SwitchSlotStyles {
  root: ViewStyle;
  row: ViewStyle;
  track: ViewStyle;
  thumb: ViewStyle;
  label: TextStyle;
  helper: TextStyle;
}

/**
 * The axes the recipe resolves on.
 *
 * There is no `checked` here, and that is deliberate: the track's colour
 * and the thumb's position are interpolated by the component from one
 * animated value, so a variant per state would compile two styles the
 * component would then have to ignore.
 */
export interface SwitchVariantSelection {
  size?: SwitchProps['size'];
  side?: SwitchProps['side'];
  disabled?: boolean;
  invalid?: boolean;
}

const SIZES = ['sm', 'md', 'lg'] as const;

/**
 * The Switch recipe.
 *
 * Explicit type annotation, as every recipe carries: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const switchRecipe: (
  tokens: SwitchTokens,
) => (props?: SwitchVariantSelection) => SwitchSlotStyles = createRecipe(
  (t: SwitchTokens) =>
    svSlots({
      slots: {
        root: { gap: t.rowGap } as ViewStyle,
        row: {
          flexDirection: 'row',
          // Centred, not top-aligned as on Checkbox: a switch is taller
          // than a line of text, so aligning it to the first line leaves
          // it sitting above the words rather than beside them.
          alignItems: 'center',
          gap: t.gap,
        } as ViewStyle,
        track: { justifyContent: 'center' } as ViewStyle,
        thumb: { ...t.elevation, position: 'absolute' } as ViewStyle,
        label: { ...resolveTypeStyle(t.typography.label), flex: 1 } as TextStyle,
        helper: resolveTypeStyle(t.typography.helper) as TextStyle,
      },
      variants: {
        size: Object.fromEntries(
          SIZES.map((size) => [
            size,
            {
              track: {
                width: t.track[size].w,
                height: t.track[size].h,
                borderRadius: t.track[size].h / 2,
              },
              thumb: {
                width: t.thumb[size],
                height: t.thumb[size],
                borderRadius: t.thumb[size] / 2,
              },
            },
          ]),
        ) as Record<(typeof SIZES)[number], { track: ViewStyle; thumb: ViewStyle }>,
        side: {
          start: { row: { flexDirection: 'row' } },
          // The switch goes last in the row rather than the label being
          // pushed: `flex: 1` on the label already takes the space.
          end: { row: { flexDirection: 'row-reverse' } },
        },
        disabled: {
          true: { label: { color: t.color.labelDisabled } },
          false: { label: { color: t.color.label } },
        },
        invalid: {
          true: { helper: { color: t.color.helperInvalid } },
          false: { helper: { color: t.color.helper } },
        },
      },
      defaultVariants: {
        size: 'md',
        side: 'end',
        disabled: false,
        invalid: false,
      },
    }),
);
