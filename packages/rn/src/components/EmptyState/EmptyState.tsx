import { Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { emptyStateRecipe } from './emptyState.variants';
import type { EmptyStateProps } from './emptyState.types';

/**
 * The screen with nothing on it.
 *
 * Three situations wear the same shape, and the point of the component
 * is that they keep wearing it: nothing yet ("Non hai ancora ordini"),
 * nothing matching ("Nessun ordine per questi filtri") and nothing
 * loaded ("Non sono riuscito a caricare"). A mark, a title, a line of
 * explanation, one thing to do about it.
 *
 * It saves five lines of `Stack`, which is not why it exists. It exists
 * so that the twenty empty screens of an application agree with each
 * other, and so that the failed request and the empty list stop being
 * two different components written by two people on two days.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="Nessun ordine"
 *   description="Quando arriverà il primo lo vedrai qui."
 *   action={<Button onPress={create}>Crea un ordine</Button>}
 * />
 *
 * <EmptyState
 *   tone="danger"
 *   title="Non sono riuscito a caricare"
 *   action={<Button variant="outline" onPress={retry}>Riprova</Button>}
 * />
 * ```
 */
export function EmptyState(props: EmptyStateProps) {
  const themeDefaults = useComponentDefaults('EmptyState');
  const tokens = useComponentTokens('EmptyState');

  const {
    title,
    description,
    icon: Icon,
    illustration,
    action,
    tone = 'neutral',
    fill = false,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as EmptyStateProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (__DEV__ && illustration && Icon) {
    console.warn(
      '[@dashforge/rn] <EmptyState> got both `illustration` and `icon`, and only ' +
        '`illustration` will be drawn. They fill the same slot.',
    );
  }

  if (!isVisible || !accessState.visible) return null;

  const styles = emptyStateRecipe(tokens)({ fill });
  const mark =
    illustration ??
    (Icon ? <Icon size={tokens.iconSize} color={tokens.color.icon[tone]} /> : null);

  return (
    <View {...rest} style={[styles.root, sx?.root]}>
      {mark}
      <View style={[styles.body, sx?.body]}>
        {typeof title === 'string' ? (
          // Announced as a heading, so heading navigation lands on the
          // one thing this screen has to say.
          <Text accessibilityRole="header" style={[styles.title, sx?.title]}>
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof description === 'string' ? (
          <Text style={[styles.description, sx?.description]}>{description}</Text>
        ) : (
          description
        )}
      </View>
      {action}
    </View>
  );
}
