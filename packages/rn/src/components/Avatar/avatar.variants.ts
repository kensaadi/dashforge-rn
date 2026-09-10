import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import type { AvatarTokens, RadiusStep } from '../../tokens/components';
import type { AvatarSize } from './avatar.types';

/** The parts an Avatar paints. */
export interface AvatarSlotStyles {
  root: ViewStyle;
  image: ImageStyle;
  initials: TextStyle;
}

export interface AvatarVariantSelection {
  size?: AvatarSize;
  radius?: RadiusStep;
}

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const STEPS: RadiusStep[] = ['none', 'sm', 'md', 'lg', 'xl', 'xxl', 'full'];

/**
 * The Avatar recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const avatarRecipe: (
  tokens: AvatarTokens,
) => (props?: AvatarVariantSelection) => AvatarSlotStyles = createRecipe(
  (t: AvatarTokens) =>
    svSlots({
      slots: {
        root: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.color.bg,
          // The picture is clipped by the circle rather than rounded
          // itself, so a square photograph does not need to know what
          // shape it was asked to be.
          overflow: 'hidden',
        } as ViewStyle,
        image: { width: '100%', height: '100%' } as ImageStyle,
        initials: {
          color: t.color.fg,
          fontWeight: t.fontWeight,
          // The letters never wrap and never shrink the circle: two
          // characters is the contract, and a third would have made the
          // avatar a different size from the one beside it.
          includeFontPadding: false,
        } as TextStyle,
      },
      variants: {
        size: Object.fromEntries(
          SIZES.map((step) => [
            step,
            {
              root: { width: t.size[step], height: t.size[step] },
              initials: { fontSize: t.fontSize[step], lineHeight: t.fontSize[step] * 1.2 },
            },
          ]),
        ) as Record<AvatarSize, { root: ViewStyle; initials: TextStyle }>,
        // Roundness as a prop, named from the scale. Arbitrary numbers
        // still go through `sx`: a step with a name is the design system,
        // a number is stepping outside it.
        radius: Object.fromEntries(
          STEPS.map((step) => [step, { root: { borderRadius: t.radius[step] } }]),
        ) as Record<RadiusStep, { root: ViewStyle }>,
      },
      defaultVariants: { size: 'md', radius: 'full' },
    }),
);
