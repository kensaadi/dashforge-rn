import type { ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { sv } from '../../theme/sv';
import type { StackTokens } from '../../tokens/components';
import type { StackProps } from './stack.types';

/** The axes the recipe resolves on. */
export interface StackVariantSelection {
  direction?: StackProps['direction'];
  gap?: 'none' | 'inline' | 'stack' | 'inset' | 'section';
  align?: StackProps['align'];
  justify?: StackProps['justify'];
  wrap?: boolean;
}

/**
 * The Stack recipe.
 *
 * A plain `sv` rather than slots: a stack paints one thing. The divider
 * is styled by the component, because it is drawn between children and
 * not on the container.
 *
 * Explicit type annotation, as every recipe carries (TS2742).
 */
export const stackRecipe: (
  tokens: StackTokens,
) => (props?: StackVariantSelection) => ViewStyle = createRecipe((t: StackTokens) =>
  sv({
    variants: {
      direction: {
        column: { flexDirection: 'column' },
        row: { flexDirection: 'row' },
      },
      gap: {
        none: { gap: t.gap.none },
        inline: { gap: t.gap.inline },
        stack: { gap: t.gap.stack },
        inset: { gap: t.gap.inset },
        section: { gap: t.gap.section },
      },
      align: {
        start: { alignItems: 'flex-start' },
        center: { alignItems: 'center' },
        end: { alignItems: 'flex-end' },
        stretch: { alignItems: 'stretch' },
        baseline: { alignItems: 'baseline' },
      },
      justify: {
        start: { justifyContent: 'flex-start' },
        center: { justifyContent: 'center' },
        end: { justifyContent: 'flex-end' },
        between: { justifyContent: 'space-between' },
        around: { justifyContent: 'space-around' },
      },
      wrap: {
        true: { flexWrap: 'wrap' },
        false: { flexWrap: 'nowrap' },
      },
    },
    defaultVariants: {
      direction: 'column',
      gap: 'stack',
      justify: 'start',
      wrap: false,
    },
  }),
) as (tokens: StackTokens) => (props?: StackVariantSelection) => ViewStyle;
