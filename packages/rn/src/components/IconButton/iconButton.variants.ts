import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import type { ActionColor, IconButtonTokens } from '../../tokens/components';
import type { IconButtonProps } from './iconButton.types';

const COLORS: ActionColor[] = ['primary', 'secondary', 'danger', 'success', 'warning'];

/**
 * The two things an IconButton produces: the box, and the colour the
 * icon is drawn in. `icon` is a style only so the recipe can carry the
 * colour through the same cache as everything else.
 */
export interface IconButtonSlotStyles {
  root: ViewStyle;
  icon: TextStyle;
}

/** `state` is internal, not a public prop. */
export interface IconButtonVariantSelection {
  variant?: IconButtonProps['variant'];
  color?: IconButtonProps['color'];
  size?: IconButtonProps['size'];
  shape?: IconButtonProps['shape'];
  state?: 'rest' | 'pressed' | 'disabled';
}

/**
 * The IconButton recipe.
 *
 * The colour compounds are generated rather than written out, as on
 * `Button`: three variants across five roles across three states is
 * forty-five entries, and forty-five hand-written entries is forty-five
 * chances to transpose two values nobody would catch.
 *
 * Explicit type annotation, as every recipe carries (TS2742).
 */
export const iconButtonRecipe: (
  tokens: IconButtonTokens,
) => (props?: IconButtonVariantSelection) => IconButtonSlotStyles = createRecipe(
  (t: IconButtonTokens) => {
    type Compound = Record<string, unknown> & {
      style: { root?: Record<string, unknown>; icon?: Record<string, unknown> };
    };
    const compounds: Compound[] = [];

    for (const color of COLORS) {
      const r = t.role[color];
      compounds.push(
        {
          variant: 'solid',
          color,
          state: 'rest',
          style: { root: { backgroundColor: r.bg }, icon: { color: r.fg } },
        },
        {
          variant: 'solid',
          color,
          state: 'pressed',
          style: { root: { backgroundColor: r.bgPressed }, icon: { color: r.fg } },
        },
        {
          variant: 'solid',
          color,
          state: 'disabled',
          style: {
            root: { backgroundColor: r.bgDisabled },
            icon: { color: r.fgDisabled },
          },
        },

        {
          variant: 'outline',
          color,
          state: 'rest',
          style: { root: { borderColor: r.border }, icon: { color: r.fgSubtle } },
        },
        {
          variant: 'outline',
          color,
          state: 'pressed',
          style: {
            root: { backgroundColor: r.bgSubtlePressed, borderColor: r.border },
            icon: { color: r.fgPressed },
          },
        },
        {
          variant: 'outline',
          color,
          state: 'disabled',
          style: { root: { borderColor: r.bgDisabled }, icon: { color: r.fgDisabled } },
        },

        {
          variant: 'ghost',
          color,
          state: 'rest',
          style: { icon: { color: r.fgSubtle } },
        },
        {
          variant: 'ghost',
          color,
          state: 'pressed',
          style: {
            root: { backgroundColor: r.bgSubtlePressed },
            icon: { color: r.fgPressed },
          },
        },
        {
          variant: 'ghost',
          color,
          state: 'disabled',
          style: { icon: { color: r.fgDisabled } },
        },
      );
    }

    return svSlots({
      slots: {
        root: {
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: t.borderWidth,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        },
        icon: {} as TextStyle,
      },
      variants: {
        variant: {
          solid: { root: { borderWidth: 0 } },
          outline: {},
          ghost: { root: { borderWidth: 0 } },
        },
        color: Object.fromEntries(COLORS.map((c) => [c, {}])) as Record<
          ActionColor,
          Record<string, never>
        >,
        size: {
          // Square: one dimension for both, so the glyph sits in the
          // middle of a shape rather than in the middle of a rectangle.
          sm: { root: { width: t.size.sm, height: t.size.sm } },
          md: { root: { width: t.size.md, height: t.size.md } },
          lg: { root: { width: t.size.lg, height: t.size.lg } },
        },
        shape: { square: {}, circle: {} },
        state: { rest: {}, pressed: {}, disabled: {} },
      },
      compoundVariants: [
        ...compounds,
        // The radius follows the size, so it has to be a compound: a
        // circle is half of whatever the button is wide.
        { shape: 'square', size: 'sm', style: { root: { borderRadius: t.radius } } },
        { shape: 'square', size: 'md', style: { root: { borderRadius: t.radius } } },
        { shape: 'square', size: 'lg', style: { root: { borderRadius: t.radius } } },
        { shape: 'circle', size: 'sm', style: { root: { borderRadius: t.size.sm / 2 } } },
        { shape: 'circle', size: 'md', style: { root: { borderRadius: t.size.md / 2 } } },
        { shape: 'circle', size: 'lg', style: { root: { borderRadius: t.size.lg / 2 } } },
      ],
      defaultVariants: {
        variant: 'ghost',
        color: 'secondary',
        size: 'md',
        shape: 'square',
        state: 'rest',
      },
    });
  },
);
