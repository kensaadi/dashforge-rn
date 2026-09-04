import type { TextStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { sv, type VariantProps } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { SemanticTokens } from '../../tokens/types';

/**
 * Typography reads the semantic tier directly rather than a component
 * token slice.
 *
 * The exception that proves the rule: a type scale and a set of text
 * colours are not this component's private business, they are the
 * product's. A `Typography` with its own copy would let the scale drift
 * from what every other component's label uses.
 */
export type TypographyTokens = Pick<SemanticTokens, 'typography' | 'text' | 'feedback'>;

const ALIGN = { left: 'left', center: 'center', right: 'right' } as const;

export const typographyRecipe: (
  t: TypographyTokens,
) => (props?: VariantProps<never> | Record<string, unknown>) => TextStyle =
  createRecipe(
    (t: TypographyTokens) =>
      sv({
        variants: {
          variant: Object.fromEntries(
            Object.entries(t.typography).map(([name, style]) => [
              name,
              resolveTypeStyle(style) as TextStyle,
            ]),
          ),
          color: {
            primary: { color: t.text.primary },
            secondary: { color: t.text.secondary },
            muted: { color: t.text.muted },
            disabled: { color: t.text.disabled },
            inverse: { color: t.text.inverse },
            onAccent: { color: t.text.onAccent },
            success: { color: t.feedback.success.fg },
            warning: { color: t.feedback.warning.fg },
            danger: { color: t.feedback.danger.fg },
            info: { color: t.feedback.info.fg },
          },
          align: {
            left: { textAlign: ALIGN.left },
            center: { textAlign: ALIGN.center },
            right: { textAlign: ALIGN.right },
          },
          weight: {
            '400': { fontWeight: '400' },
            '500': { fontWeight: '500' },
            '700': { fontWeight: '700' },
          },
        },
        defaultVariants: { variant: 'body', color: 'primary', align: 'left' },
      }) as never,
  );
