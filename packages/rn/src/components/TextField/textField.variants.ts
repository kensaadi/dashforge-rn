import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { TextFieldTokens, RadiusStep } from '../../tokens/components';

export interface TextFieldSlotStyles {
  root: ViewStyle;
  label: TextStyle;
  control: ViewStyle;
  input: TextStyle;
  helper: TextStyle;
}

export interface TextFieldVariantSelection {
  radius?: RadiusStep;
  size?: 'sm' | 'md' | 'lg';
  multiline?: boolean;
  /** `rest` and `focused` are mutually exclusive; `invalid` is not. */
  state?: 'rest' | 'focused' | 'disabled';
  invalid?: boolean;
  fullWidth?: boolean;
}

/**
 * The input's type style, **without** its line height.
 *
 * On iOS a `TextInput` with an explicit `lineHeight` reserves that much
 * vertical space but draws the glyphs at the top of it, putting the
 * whole leading underneath. On a single-line field that reads as text
 * sitting high in its box with the caret hanging below, and centring the
 * row does not fix it because what is being centred is the line box, not
 * the glyphs.
 *
 * Line height comes back for `multiline`, where it means what it is for.
 */
function singleLineTypeStyle(t: TextFieldTokens): TextStyle {
  const { lineHeight: _lineHeight, ...rest } = resolveTypeStyle(t.typography.input);
  return rest;
}

export const textFieldRecipe: (
  tokens: TextFieldTokens,
) => (props?: TextFieldVariantSelection) => TextFieldSlotStyles = createRecipe(
  (t: TextFieldTokens) =>
    svSlots({
      slots: {
        root: { gap: t.gap, alignSelf: 'flex-start' } as ViewStyle,
        label: {
          ...resolveTypeStyle(t.typography.label),
          color: t.color.label,
        } as TextStyle,
        control: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: t.borderWidth,
          borderColor: t.color.border,
          backgroundColor: t.color.bg,
        } as ViewStyle,
        input: {
          flex: 1,
          ...singleLineTypeStyle(t),
          color: t.color.text,
          // React Native gives a TextInput its own intrinsic padding, and
          // a different amount of it per platform. Zeroing it here is the
          // "neutralise the platform first" rule: the control's padding
          // is ours, applied on the box around the input.
          padding: 0,
          margin: 0,
          // Android adds its own font padding above and below the glyphs,
          // asymmetrically. Removing it is the other half of neutralising
          // the platform, and without it the same field sits differently
          // on the two operating systems.
          includeFontPadding: false,
        } as TextStyle,
        helper: {
          ...resolveTypeStyle(t.typography.helper),
          color: t.color.helper,
        } as TextStyle,
      },
      variants: {
        // Roundness as a prop, named from the scale. Arbitrary numbers
        // still go through `sx`: a step with a name is the design system,
        // a number is stepping outside it.
        radius: {
          none: { control: { borderRadius: t.radius.none } },
          sm: { control: { borderRadius: t.radius.sm } },
          md: { control: { borderRadius: t.radius.md } },
          lg: { control: { borderRadius: t.radius.lg } },
          xl: { control: { borderRadius: t.radius.xl } },
          '2xl': { control: { borderRadius: t.radius['2xl'] } },
          full: { control: { borderRadius: t.radius.full } },
        },
        size: {
          sm: {
            control: {
              minHeight: t.minHeight.sm,
              paddingHorizontal: t.paddingHorizontal.sm,
            },
          },
          md: {
            control: {
              minHeight: t.minHeight.md,
              paddingHorizontal: t.paddingHorizontal.md,
            },
          },
          lg: {
            control: {
              minHeight: t.minHeight.lg,
              paddingHorizontal: t.paddingHorizontal.lg,
            },
          },
        },
        state: {
          rest: {},
          focused: {
            // Thicker as well as recoloured. A ring that only changes
            // hue is invisible to a reader who cannot separate the two
            // colours, and focus is exactly the state they most need.
            control: {
              borderColor: t.color.borderFocused,
              borderWidth: t.borderWidthFocused,
            },
          },
          disabled: {
            control: {
              backgroundColor: t.color.bgDisabled,
              borderColor: t.color.borderDisabled,
            },
            label: { color: t.color.labelDisabled },
            input: { color: t.color.textDisabled },
          },
        },
        invalid: {
          true: {
            control: { borderColor: t.color.borderInvalid },
            helper: { color: t.color.helperInvalid },
          },
          false: {},
        },
        fullWidth: {
          true: { root: { alignSelf: 'stretch' } },
          // React Native stretches a column child by default, so the
          // false case has to say so or the parent decides for us.
          false: { root: { alignSelf: 'flex-start' } },
        },
        multiline: {
          true: {
            // Line height is meaningful again once there is more than one
            // line, and the text has to start at the top rather than sit
            // in the middle of a tall box.
            input: {
              lineHeight: resolveTypeStyle(t.typography.input).lineHeight,
              textAlignVertical: 'top',
            },
            control: { alignItems: 'stretch', paddingVertical: 10 },
          },
          false: {},
        },
      },
      compoundVariants: [
        // Invalid must not swallow focus: a field being corrected is
        // still the field the caret is in, and losing that is worse than
        // losing the red.
        {
          state: 'focused',
          invalid: true,
          style: {
            control: {
              borderColor: t.color.borderInvalid,
              borderWidth: t.borderWidthFocused,
            },
          },
        },
        // Disabled outranks invalid. There is nothing to correct in a
        // field you cannot type into, and red on grey reads as an error
        // the user is being blamed for and cannot fix.
        {
          state: 'disabled',
          invalid: true,
          style: {
            control: {
              borderColor: t.color.borderDisabled,
              borderWidth: t.borderWidth,
            },
            helper: { color: t.color.helper },
          },
        },
      ],
      defaultVariants: {
        size: 'md',
        state: 'rest',
        invalid: false,
        fullWidth: false,
        multiline: false,
        radius: 'md',
      },
    }),
);
