import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { CheckboxTokens } from '../../tokens/components';
import type { CheckboxProps } from './checkbox.types';

/** The parts a Checkbox paints. */
export interface CheckboxSlotStyles {
  root: ViewStyle;
  row: ViewStyle;
  box: ViewStyle;
  /** The tick: a corner of a box, turned. */
  tick: ViewStyle;
  /** The bar drawn instead of the tick when the state is mixed. */
  bar: ViewStyle;
  label: TextStyle;
  helper: TextStyle;
}

/** `state` is internal, not a public prop. */
export interface CheckboxVariantSelection {
  size?: CheckboxProps['size'];
  state?: 'off' | 'on' | 'disabled' | 'disabledOn';
  invalid?: boolean;
}

const SIZES = ['sm', 'md', 'lg'] as const;

/**
 * The Checkbox recipe.
 *
 * The mark is drawn rather than imported: a tick is two edges of a box
 * turned forty-five degrees, and a library that ships three dependencies
 * is not going to add an icon set for one glyph.
 *
 * Explicit type annotation, as every recipe carries: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const checkboxRecipe: (
  tokens: CheckboxTokens,
) => (props?: CheckboxVariantSelection) => CheckboxSlotStyles = createRecipe(
  (t: CheckboxTokens) => {
    /** The tick is a corner of a box, so its size follows the box. */
    const tickFor = (size: (typeof SIZES)[number]): ViewStyle => {
      const box = t.box[size];
      return {
        width: box * 0.3,
        height: box * 0.56,
        borderRightWidth: t.markWidth[size],
        borderBottomWidth: t.markWidth[size],
        // Turned, and lifted by a hair: rotating a rectangle about its
        // centre leaves the tick sitting low in the box.
        transform: [{ rotate: '45deg' }, { translateY: -box * 0.06 }],
      };
    };

    const barFor = (size: (typeof SIZES)[number]): ViewStyle => ({
      width: t.box[size] * 0.5,
      height: t.markWidth[size],
      borderRadius: t.markWidth[size],
    });

    return svSlots({
      slots: {
        root: { gap: t.rowGap } as ViewStyle,
        row: {
          flexDirection: 'row',
          // Top rather than centre, so the box stays level with the
          // first line when the label runs to two.
          alignItems: 'flex-start',
          gap: t.gap,
        } as ViewStyle,
        box: {
          borderWidth: t.borderWidth,
          borderRadius: t.radius,
          alignItems: 'center',
          justifyContent: 'center',
        } as ViewStyle,
        tick: {} as ViewStyle,
        bar: {} as ViewStyle,
        label: { ...resolveTypeStyle(t.typography.label), flex: 1 } as TextStyle,
        helper: resolveTypeStyle(t.typography.helper) as TextStyle,
      },
      variants: {
        size: Object.fromEntries(
          SIZES.map((size) => [
            size,
            {
              box: { width: t.box[size], height: t.box[size] },
              tick: tickFor(size),
              bar: barFor(size),
            },
          ]),
        ) as Record<
          (typeof SIZES)[number],
          { box: ViewStyle; tick: ViewStyle; bar: ViewStyle }
        >,
        state: {
          off: {
            box: { backgroundColor: t.color.bg, borderColor: t.color.border },
            label: { color: t.color.label },
          },
          on: {
            box: {
              backgroundColor: t.color.bgChecked,
              borderColor: t.color.borderChecked,
            },
            tick: { borderColor: t.color.mark },
            bar: { backgroundColor: t.color.mark },
            label: { color: t.color.label },
          },
          disabled: {
            box: {
              backgroundColor: t.color.bgDisabled,
              borderColor: t.color.borderDisabled,
            },
            label: { color: t.color.labelDisabled },
          },
          disabledOn: {
            box: {
              backgroundColor: t.color.bgCheckedDisabled,
              borderColor: t.color.borderDisabled,
            },
            tick: { borderColor: t.color.markDisabled },
            bar: { backgroundColor: t.color.markDisabled },
            label: { color: t.color.labelDisabled },
          },
        },
        invalid: {
          true: {
            box: { borderColor: t.color.borderInvalid },
            helper: { color: t.color.helperInvalid },
          },
          false: { helper: { color: t.color.helper } },
        },
      },
      compoundVariants: [
        // Invalid says nothing about a disabled field: there is nothing
        // to correct on something the user cannot touch.
        {
          state: 'disabled',
          invalid: true,
          style: { box: { borderColor: t.color.borderDisabled } },
        },
        {
          state: 'disabledOn',
          invalid: true,
          style: { box: { borderColor: t.color.borderDisabled } },
        },
      ],
      defaultVariants: { size: 'md', state: 'off', invalid: false },
    });
  },
);
