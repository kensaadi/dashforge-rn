import { Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { dividerRecipe } from './divider.variants';
import type { DividerProps } from './divider.types';

/**
 * A line between two things, and the air around it.
 *
 * The air is the point. A hairline drawn with no margins is a line the
 * caller then has to space by hand at every call site, and that is where
 * a design starts to drift; `spacing` is the prop, and the default is
 * the one a page wants.
 *
 * It is **not** what separates rows in a list: that line belongs to the
 * row above it and is drawn by `List`, because only a list knows which
 * row is first. This is for the break between two sections.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider label="oppure" />
 * <Stack direction="row"><A /><Divider orientation="vertical" spacing="sm" /><B /></Stack>
 * ```
 */
export function Divider(props: DividerProps) {
  const themeDefaults = useComponentDefaults('Divider');
  const tokens = useComponentTokens('Divider');

  const {
    orientation = 'horizontal',
    spacing = 'md',
    label,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as DividerProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (__DEV__ && label && orientation === 'vertical') {
    console.warn(
      '[@dashforge/rn] <Divider> has a label and orientation="vertical", and the label is ' +
        'ignored. There is no room for a word in a vertical rule.',
    );
  }

  if (!isVisible || !accessState.visible) return null;

  const labelled = Boolean(label) && orientation === 'horizontal';
  const styles = dividerRecipe(tokens)({ orientation, spacing, labelled });

  return (
    <View
      // A bare rule is decoration and is announced as nothing: a screen
      // reader that stops on every line on a page is one nobody uses.
      //
      // A labelled one is not decoration. "oppure" is the word that
      // tells somebody there is another way to sign in, and hiding it
      // because it happens to be drawn between two lines would take that
      // away from exactly the people who cannot see the lines.
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'auto' : 'no-hide-descendants'}
      {...rest}
      style={[styles.root, sx?.root]}
    >
      <View style={[styles.line, sx?.line]} />
      {labelled ? (
        <>
          {typeof label === 'string' ? (
            <Text style={[styles.label, sx?.label]}>{label}</Text>
          ) : (
            label
          )}
          <View style={[styles.line, sx?.line]} />
        </>
      ) : null}
    </View>
  );
}
