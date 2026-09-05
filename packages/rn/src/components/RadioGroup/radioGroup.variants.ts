import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { RadioGroupTokens } from '../../tokens/components';
import type { RadioGroupProps } from './radioGroup.types';

/** The parts a RadioGroup and its options paint. */
export interface RadioGroupSlotStyles {
  root: ViewStyle;
  legend: TextStyle;
  options: ViewStyle;
  row: ViewStyle;
  circle: ViewStyle;
  dot: ViewStyle;
  label: TextStyle;
  helper: TextStyle;
}

/** `state` is internal, not a public prop. */
export interface RadioGroupVariantSelection {
  size?: RadioGroupProps['size'];
  orientation?: RadioGroupProps['orientation'];
  state?: 'off' | 'on' | 'disabled' | 'disabledOn';
  invalid?: boolean;
}

const SIZES = ['sm', 'md', 'lg'] as const;

/**
 * The RadioGroup recipe.
 *
 * One recipe for both the group and its options: they are two components
 * only because the options are children, and splitting the styles would
 * mean two token lookups and two caches for one control.
 *
 * Explicit type annotation, as every recipe carries: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const radioGroupRecipe: (
  tokens: RadioGroupTokens,
) => (props?: RadioGroupVariantSelection) => RadioGroupSlotStyles = createRecipe(
  (t: RadioGroupTokens) =>
    svSlots({
      slots: {
        root: { gap: t.groupGap } as ViewStyle,
        legend: {
          ...resolveTypeStyle(t.typography.legend),
          color: t.color.legend,
        } as TextStyle,
        options: { gap: t.optionGap } as ViewStyle,
        row: {
          flexDirection: 'row',
          // Top rather than centre, so the circle stays level with the
          // first line when an answer runs to two.
          alignItems: 'flex-start',
          gap: t.gap,
        } as ViewStyle,
        circle: {
          borderWidth: t.borderWidth,
          alignItems: 'center',
          justifyContent: 'center',
        } as ViewStyle,
        dot: {} as ViewStyle,
        label: { ...resolveTypeStyle(t.typography.label), flexShrink: 1 } as TextStyle,
        helper: resolveTypeStyle(t.typography.helper) as TextStyle,
      },
      variants: {
        size: Object.fromEntries(
          SIZES.map((size) => [
            size,
            {
              circle: {
                width: t.circle[size],
                height: t.circle[size],
                borderRadius: t.circle[size] / 2,
              },
              dot: {
                width: t.dot[size],
                height: t.dot[size],
                borderRadius: t.dot[size] / 2,
              },
            },
          ]),
        ) as Record<(typeof SIZES)[number], { circle: ViewStyle; dot: ViewStyle }>,
        orientation: {
          vertical: { options: { flexDirection: 'column' } },
          horizontal: {
            options: {
              flexDirection: 'row',
              // Wrapping, because three short answers on one line is the
              // case this exists for and a phone is narrow.
              flexWrap: 'wrap',
              columnGap: 20,
            },
          },
        },
        state: {
          off: {
            circle: { backgroundColor: t.color.bg, borderColor: t.color.border },
            label: { color: t.color.label },
          },
          on: {
            circle: { backgroundColor: t.color.bg, borderColor: t.color.borderChecked },
            dot: { backgroundColor: t.color.dot },
            label: { color: t.color.label },
          },
          disabled: {
            circle: {
              backgroundColor: t.color.bgDisabled,
              borderColor: t.color.borderDisabled,
            },
            label: { color: t.color.labelDisabled },
          },
          disabledOn: {
            circle: {
              backgroundColor: t.color.bgDisabled,
              borderColor: t.color.borderDisabled,
            },
            dot: { backgroundColor: t.color.dotDisabled },
            label: { color: t.color.labelDisabled },
          },
        },
        invalid: {
          true: { helper: { color: t.color.helperInvalid } },
          false: { helper: { color: t.color.helper } },
        },
      },
      compoundVariants: [
        // The invalid edge is on the unanswered circles only: a chosen
        // one is the answer, and reddening it says the answer is wrong
        // when what is wrong is that there is none.
        {
          state: 'off',
          invalid: true,
          style: { circle: { borderColor: t.color.borderInvalid } },
        },
      ],
      defaultVariants: {
        size: 'md',
        orientation: 'vertical',
        state: 'off',
        invalid: false,
      },
    }),
);
