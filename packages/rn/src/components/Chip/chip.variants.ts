import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { ActionColor, ChipTokens, RadiusStep } from '../../tokens/components';
import type { ChipProps } from './chip.types';

/** The parts a Chip paints. */
export interface ChipSlotStyles {
  root: ViewStyle;
  label: TextStyle;
  /** One arm of the cross; the component draws two, crossed. */
  removeArm: ViewStyle;
  /** The cross's own touch target. */
  remove: ViewStyle;
}

export interface ChipVariantSelection {
  size?: ChipProps['size'];
  radius?: RadiusStep;
  color?: ActionColor;
  selected?: boolean;
  pressed?: boolean;
  disabled?: boolean;
}

const SIZES = ['sm', 'md', 'lg'] as const;
const STEPS: RadiusStep[] = ['none', 'sm', 'md', 'lg', 'xl', 'xxl', 'full'];
const COLORS: ActionColor[] = ['primary', 'secondary', 'danger', 'success', 'warning'];

/**
 * The Chip recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const chipRecipe: (
  tokens: ChipTokens,
) => (props?: ChipVariantSelection) => ChipSlotStyles = createRecipe((t: ChipTokens) =>
  svSlots({
    slots: {
      root: {
        flexDirection: 'row',
        alignItems: 'center',
        // `minHeight` and never `height`: a chip grows when the user's
        // text-size setting demands it instead of clipping its word.
        alignSelf: 'flex-start',
        borderWidth: t.borderWidth,
      } as ViewStyle,
      label: { ...resolveTypeStyle(t.typography.label) } as TextStyle,
      remove: { alignItems: 'center', justifyContent: 'center' } as ViewStyle,
      removeArm: { position: 'absolute', height: t.remove.thickness } as ViewStyle,
    },
    variants: {
      size: Object.fromEntries(
        SIZES.map((step) => [
          step,
          {
            root: {
              minHeight: t.height[step],
              paddingHorizontal: t.paddingHorizontal[step],
              gap: t.gap[step],
            },
            remove: { width: t.remove.size[step], height: t.remove.size[step] },
            removeArm: { width: t.remove.size[step] },
          },
        ]),
      ) as Record<'sm' | 'md' | 'lg', { root: ViewStyle; remove: ViewStyle; removeArm: ViewStyle }>,
      radius: Object.fromEntries(
        STEPS.map((step) => [step, { root: { borderRadius: t.radius[step] } }]),
      ) as Record<RadiusStep, { root: ViewStyle }>,
      color: Object.fromEntries(COLORS.map((c) => [c, {}])) as Record<ActionColor, object>,
      selected: { true: {}, false: {} },
      pressed: { true: {}, false: {} },
      disabled: {
        true: {
          root: { backgroundColor: t.color.bgDisabled, borderColor: t.color.borderDisabled },
          label: { color: t.color.labelDisabled },
          removeArm: { backgroundColor: t.color.labelDisabled },
        },
        false: {},
      },
    },
    compoundVariants: [
      ...COLORS.flatMap((color) => [
        {
          color,
          selected: false,
          disabled: false,
          style: {
            root: { backgroundColor: t.tone[color].bg, borderColor: t.tone[color].border },
            label: { color: t.tone[color].fg },
            removeArm: { backgroundColor: t.tone[color].fg },
          },
        },
        {
          color,
          selected: true,
          disabled: false,
          style: {
            root: {
              backgroundColor: t.tone[color].bgSelected,
              borderColor: t.tone[color].borderSelected,
            },
            label: { color: t.tone[color].fgSelected },
            removeArm: { backgroundColor: t.tone[color].fgSelected },
          },
        },
        // A press tints the unchosen chip, which has no fill to deepen.
        // The chosen one keeps its fill: dimming it would say disabled.
        {
          color,
          selected: false,
          pressed: true,
          disabled: false,
          style: { root: { backgroundColor: t.tone[color].bgPressed } },
        },
      ]),
    ],
    defaultVariants: {
      size: 'md',
      radius: 'full',
      color: 'primary',
      selected: false,
      pressed: false,
      disabled: false,
    },
  }),
);
