import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { SelectTokens } from '../../tokens/components';
import type { SelectProps } from './select.types';

/** The parts a Select paints while it is closed. */
export interface SelectSlotStyles {
  root: ViewStyle;
  label: TextStyle;
  trigger: ViewStyle;
  value: TextStyle;
  helper: TextStyle;
  /** Two edges of a square, turned, which is the whole chevron. */
  chevron: ViewStyle;
}

/** `state` is internal, not a public prop. */
export interface SelectVariantSelection {
  size?: SelectProps['size'];
  state?: 'rest' | 'open' | 'disabled';
  invalid?: boolean;
  /** Whether anything has been chosen, which decides the text colour. */
  filled?: boolean;
}

const SIZES = ['sm', 'md', 'lg'] as const;

/**
 * The Select recipe, for the closed control only.
 *
 * What the list looks like when it opens is `RadioGroup`'s business, and
 * that is the point of building it this way rather than drawing rows
 * here: one answer among several already has a component, and it already
 * announces itself correctly.
 *
 * Explicit type annotation, as every recipe carries (TS2742).
 */
export const selectRecipe: (
  tokens: SelectTokens,
) => (props?: SelectVariantSelection) => SelectSlotStyles = createRecipe(
  (t: SelectTokens) =>
    svSlots({
      slots: {
        root: { gap: t.gap } as ViewStyle,
        label: {
          ...resolveTypeStyle(t.typography.label),
          color: t.color.label,
        } as TextStyle,
        trigger: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderRadius: t.radius,
          borderWidth: t.borderWidth,
          backgroundColor: t.color.bg,
          borderColor: t.color.border,
        } as ViewStyle,
        value: {
          ...resolveTypeStyle(t.typography.value),
          color: t.color.value,
          flexShrink: 1,
        } as TextStyle,
        helper: {
          ...resolveTypeStyle(t.typography.helper),
          color: t.color.helper,
        } as TextStyle,
        chevron: {
          width: t.chevron.size,
          height: t.chevron.size,
          borderRightWidth: t.chevron.thickness,
          borderBottomWidth: t.chevron.thickness,
          borderColor: t.color.chevron,
          // Turned, and lifted by a hair: a rotated square sits low
          // against the text it is beside.
          transform: [{ rotate: '45deg' }, { translateY: -t.chevron.size * 0.2 }],
        } as ViewStyle,
      },
      variants: {
        size: Object.fromEntries(
          SIZES.map((size) => [
            size,
            {
              trigger: {
                minHeight: t.minHeight[size],
                paddingHorizontal: t.paddingHorizontal[size],
              },
            },
          ]),
        ) as Record<(typeof SIZES)[number], { trigger: ViewStyle }>,
        state: {
          rest: {},
          open: {
            trigger: {
              borderColor: t.color.borderOpen,
              // Thicker rather than only recoloured, as on `TextField`:
              // the ring has to read for someone who cannot separate the
              // two colours.
              borderWidth: t.borderWidthFocused,
            },
          },
          disabled: {
            trigger: {
              backgroundColor: t.color.bgDisabled,
              borderColor: t.color.borderDisabled,
            },
            value: { color: t.color.valueDisabled },
            label: { color: t.color.labelDisabled },
          },
        },
        invalid: {
          true: {
            trigger: { borderColor: t.color.borderInvalid },
            helper: { color: t.color.helperInvalid },
          },
          false: {},
        },
        filled: {
          true: {},
          // Nothing chosen yet: the words are a placeholder and are
          // coloured as one, so the control does not read as answered.
          false: { value: { color: t.color.placeholder } },
        },
      },
      compoundVariants: [
        // Nothing to correct on a control the user cannot open.
        {
          state: 'disabled',
          invalid: true,
          style: { trigger: { borderColor: t.color.borderDisabled } },
        },
        {
          state: 'disabled',
          filled: false,
          style: { value: { color: t.color.valueDisabled } },
        },
      ],
      defaultVariants: { size: 'md', state: 'rest', invalid: false, filled: false },
    }),
);
