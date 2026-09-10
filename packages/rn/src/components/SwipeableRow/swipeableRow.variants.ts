import type { TextStyle, ViewStyle } from 'react-native';
import { createRecipe } from '../../theme/createRecipe';
import { svSlots } from '../../theme/sv';
import { resolveTypeStyle } from '../../theme/typography';
import type { SwipeableRowTokens } from '../../tokens/components';

/** The parts a SwipeableRow paints. */
export interface SwipeableRowSlotStyles {
  root: ViewStyle;
  /** The layer that travels under the finger. */
  content: ViewStyle;
  /** The strip of actions on one side. */
  panel: ViewStyle;
  action: ViewStyle;
  actionLabel: TextStyle;
}

/**
 * The SwipeableRow recipe.
 *
 * No axes: the row has one appearance, and the colour of an action is
 * read per action rather than compiled into a combination. Still a
 * recipe so the styles are registered once with the engine rather than
 * rebuilt on every render of every row in a list.
 *
 * Recipes carry an explicit type annotation, always: without one `tsc`
 * reaches into React Native's generated internals and refuses to emit a
 * portable declaration (TS2742).
 */
export const swipeableRowRecipe: (
  tokens: SwipeableRowTokens,
) => () => SwipeableRowSlotStyles = createRecipe(
  (t: SwipeableRowTokens) =>
    svSlots({
      slots: {
        // Clipped, so an action that has not been revealed yet is not
        // drawn outside the row and over its neighbours.
        root: { overflow: 'hidden' } as ViewStyle,
        // Opaque, and it has to be. The row slides over its own
        // actions, so a transparent layer shows them through itself
        // while the row is closed. Found by looking at it: the test
        // renderer has no idea what is drawn behind what.
        content: { backgroundColor: t.contentBg } as ViewStyle,
        panel: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          flexDirection: 'row',
        } as ViewStyle,
        action: {
          width: t.actionWidth,
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.actionGap,
          // Stretches to the row, whatever height the row turned out to
          // be: an action panel that guessed would leave a band of the
          // list's ground showing at one end.
          alignSelf: 'stretch',
        } as ViewStyle,
        actionLabel: {
          ...resolveTypeStyle(t.typography.label),
          textAlign: 'center',
        } as TextStyle,
      },
      variants: {},
    }),
);
