import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { DividerTokens } from '../../tokens/components';
import type { DividerProps } from './divider.types';

/** The parts a Divider paints. */
export interface DividerSlotStyles {
  root: ViewStyle;
  line: ViewStyle;
  label: TextStyle;
}

export interface DividerVariantSelection {
  orientation?: DividerProps['orientation'];
  spacing?: DividerProps['spacing'];
  labelled?: boolean;
}

/**
 * The Divider recipe.
 *
 * Reads its own component tokens and nothing above them.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const dividerRecipe: (
  tokens: DividerTokens,
) => (props?: DividerVariantSelection) => DividerSlotStyles = createRecipe(
  (t: DividerTokens) =>
    svSlots({
      slots: {
        root: {} as ViewStyle,
        line: { backgroundColor: t.color } as ViewStyle,
        label: {
          ...resolveTypeStyle(t.typography.label),
          color: t.labelColor,
          marginHorizontal: t.labelGap,
        } as TextStyle,
      },
      variants: {
        // Everything stretches or flexes, and nothing is a percentage.
        //
        // A percentage resolves against the parent's size, and the
        // parent here is stretched to fit its children: the line asks
        // how tall its parent is, the parent answers "as tall as my
        // children", and Yoga resolves that circle by measuring the row
        // as unbounded. On screen the divider ran the whole height of the
        // page and dragged the card with it. Found by looking, not by a
        // test, which is the second time this session.
        orientation: {
          horizontal: {
            root: { alignSelf: 'stretch' },
            // Height and not `borderWidth`: a background on a box of a
            // known height is one value to theme, and it does not
            // inherit a colour from anything.
            line: { height: t.thickness, alignSelf: 'stretch' },
          },
          vertical: {
            // It takes the height of the row it is in, which is the only
            // sane answer for a rule between two things whose height the
            // divider cannot know.
            root: { alignSelf: 'stretch', width: t.thickness },
            line: { width: t.thickness, flex: 1 },
          },
        },
        spacing: {
          none: {},
          sm: {},
          md: {},
          lg: {},
        },
        // With a label the root becomes the row that holds line, words,
        // line, and each line takes what is left of the width. It must
        // stop stretching vertically at that point, or a line inside a
        // row would grow to the height of the words beside it.
        labelled: {
          true: {
            root: { flexDirection: 'row', alignItems: 'center' },
            line: { flex: 1, alignSelf: 'auto' },
          },
          false: {},
        },
      },
      compoundVariants: [
        ...(['none', 'sm', 'md', 'lg'] as const).flatMap((step) => [
          {
            orientation: 'horizontal' as const,
            spacing: step,
            style: { root: { marginVertical: t.spacing[step] } },
          },
          {
            orientation: 'vertical' as const,
            spacing: step,
            style: { root: { marginHorizontal: t.spacing[step] } },
          },
        ]),
      ],
      defaultVariants: {
        orientation: 'horizontal',
        spacing: 'md',
        labelled: false,
      },
    }),
);
