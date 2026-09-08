import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { ActionColor, ButtonTokens } from '../../tokens/components';
import type { ButtonProps } from './button.types';

const COLORS: ActionColor[] = ['primary', 'secondary', 'danger', 'success', 'warning'];

/** The two parts a Button paints. `sx` still targets the root alone. */
export interface ButtonSlotStyles {
  root: ViewStyle;
  label: TextStyle;
}

/** The axes the recipe resolves on. `state` is internal, not a public prop. */
export interface ButtonVariantSelection {
  variant?: ButtonProps['variant'];
  radius?: ButtonProps['radius'];
  color?: ButtonProps['color'];
  size?: ButtonProps['size'];
  state?: 'rest' | 'pressed' | 'disabled';
  fullWidth?: boolean;
}

/**
 * Recipes carry an explicit type annotation, always.
 *
 * Without one, `tsc` infers a type that reaches into React Native's
 * generated internals and refuses to emit a portable declaration
 * (TS2742). The annotation is also the honest documentation of what a
 * recipe hands back.
 */

/**
 * The Button recipe.
 *
 * Reads its own component tokens and nothing above them: no palette, no
 * semantic layer, no literals. That is what makes every style this
 * component can produce reachable from `theme.components.Button.tokens`.
 *
 * The colour compounds are generated rather than written out. Four
 * variants across five roles across three states is sixty entries, and
 * sixty hand-written entries is sixty chances to transpose two hex
 * values that nobody would catch.
 */
export const buttonRecipe: (
  tokens: ButtonTokens,
) => (props?: ButtonVariantSelection) => ButtonSlotStyles = createRecipe(
  (t: ButtonTokens) => {
    type Compound = Record<string, unknown> & {
      style: { root?: Record<string, unknown>; label?: Record<string, unknown> };
    };
    const compounds: Compound[] = [];

    for (const color of COLORS) {
      const r = t.role[color];
      compounds.push(
        // solid: the fill carries the meaning, the label sits on it
        {
          variant: 'solid',
          color,
          state: 'rest',
          style: {
            root: { backgroundColor: r.bg, borderColor: r.bg },
            label: { color: r.fg },
          },
        },
        {
          variant: 'solid',
          color,
          state: 'pressed',
          style: {
            root: { backgroundColor: r.bgPressed, borderColor: r.bgPressed },
            label: { color: r.fg },
          },
        },
        {
          variant: 'solid',
          color,
          state: 'disabled',
          style: {
            root: { backgroundColor: r.bgDisabled, borderColor: r.bgDisabled },
            label: { color: r.fgDisabled },
          },
        },

        // outline: the edge carries it, and the press grows a tint
        {
          variant: 'outline',
          color,
          state: 'rest',
          style: { root: { borderColor: r.border }, label: { color: r.fgSubtle } },
        },
        {
          variant: 'outline',
          color,
          state: 'pressed',
          style: {
            root: { backgroundColor: r.bgSubtlePressed, borderColor: r.border },
            label: { color: r.fgPressed },
          },
        },
        {
          variant: 'outline',
          color,
          state: 'disabled',
          style: {
            root: { borderColor: r.bgDisabled },
            label: { color: r.fgDisabled },
          },
        },

        // ghost: nothing but the label until it is held
        {
          variant: 'ghost',
          color,
          state: 'rest',
          style: { label: { color: r.fgSubtle } },
        },
        {
          variant: 'ghost',
          color,
          state: 'pressed',
          style: {
            root: { backgroundColor: r.bgSubtlePressed },
            label: { color: r.fgPressed },
          },
        },
        {
          variant: 'ghost',
          color,
          state: 'disabled',
          style: { label: { color: r.fgDisabled } },
        },

        // link: no fill anywhere to move, so the label moves instead
        {
          variant: 'link',
          color,
          state: 'rest',
          style: { label: { color: r.fgSubtle } },
        },
        {
          variant: 'link',
          color,
          state: 'pressed',
          style: { label: { color: r.fgPressed } },
        },
        {
          variant: 'link',
          color,
          state: 'disabled',
          style: { label: { color: r.fgDisabled } },
        },
      );
    }

    // Applied after the size axis, so it clears the padding and height a
    // size would otherwise impose. A link lives inside flowing text.
    compounds.push({
      variant: 'link',
      style: {
        root: { paddingHorizontal: 0, minHeight: 0, borderWidth: 0 },
        label: { textDecorationLine: 'underline' },
      },
    });

    return svSlots({
      slots: {
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: t.borderWidth,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        },
        label: resolveTypeStyle(t.typography),
      },
      variants: {
        variant: {
          solid: { root: { borderWidth: 0 } },
          outline: {},
          ghost: { root: { borderWidth: 0 } },
          link: {},
        },
        radius: {
          none: { root: { borderRadius: t.radius.none } },
          sm: { root: { borderRadius: t.radius.sm } },
          md: { root: { borderRadius: t.radius.md } },
          lg: { root: { borderRadius: t.radius.lg } },
          xl: { root: { borderRadius: t.radius.xl } },
          '2xl': { root: { borderRadius: t.radius['2xl'] } },
          full: { root: { borderRadius: t.radius.full } },
        },
        color: Object.fromEntries(COLORS.map((c) => [c, {}])),
        size: {
          sm: {
            root: {
              minHeight: t.minHeight.sm,
              paddingHorizontal: t.paddingHorizontal.sm,
              gap: t.gap.sm,
            },
          },
          md: {
            root: {
              minHeight: t.minHeight.md,
              paddingHorizontal: t.paddingHorizontal.md,
              gap: t.gap.md,
            },
          },
          lg: {
            root: {
              minHeight: t.minHeight.lg,
              paddingHorizontal: t.paddingHorizontal.lg,
              gap: t.gap.lg,
            },
          },
        },
        state: { rest: {}, pressed: {}, disabled: {} },
        fullWidth: {
          true: { root: { alignSelf: 'stretch' } },
          // Not an empty object: a child of a column `View` stretches by
          // default on React Native, the opposite of the web, so `false`
          // has to say so out loud or the parent decides for us and
          // `fullWidth` appears to do nothing.
          false: { root: { alignSelf: 'flex-start' } },
        },
      },
      compoundVariants: compounds as never,
      defaultVariants: {
        variant: 'solid',
        color: 'primary',
        size: 'md',
        radius: 'md',
        state: 'rest',
        fullWidth: false,
      },
    });
  },
);
