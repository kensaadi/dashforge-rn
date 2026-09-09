import { createContext, useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { listItemRecipe } from './listItem.variants';
import type { ListDivider, ListItemProps, ListProps } from './listItem.types';

/**
 * What a list tells its rows.
 *
 * Only the hairline, because that is the only thing a row cannot decide
 * on its own: whether there is a row above it to be separated from.
 *
 * @internal
 */
export const ListContext = createContext<{ divider: ListDivider }>({
  divider: 'none',
});

/**
 * One row. The unit a mobile application uses where the web reaches for
 * a table.
 *
 * Four places to put something: a leading slot, the title and its
 * subtitle, a short value, and a trailing slot. Everything else the
 * component decides, which is the point: rows in one application should
 * not drift apart because two people built them out of `Stack` on
 * different days.
 *
 * **It has no ground of its own.** A row is dropped into a card, a
 * sheet or the page, and any colour it painted at rest would be right in
 * one of those and wrong in the other two. It paints only while pressed.
 *
 * @example
 * ```tsx
 * <ListItem title="Lingua" value="Italiano" chevron onPress={openLanguages} />
 * <ListItem title="Notifiche" subtitle="Push e email" trailing={<Switch …/>} />
 * ```
 */
export function ListItem(props: ListItemProps) {
  const themeDefaults = useComponentDefaults('ListItem');
  const tokens = useComponentTokens('ListItem');
  const theme = useTheme();
  const { divider } = useContext(ListContext);

  const {
    title,
    subtitle,
    value,
    leading,
    icon: Icon,
    trailing,
    chevron = false,
    onPress,
    onLongPress,
    disabled = false,
    titleLines = 1,
    subtitleLines = 2,
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as ListItemProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (__DEV__ && leading && Icon) {
    console.warn(
      '[@dashforge/rn] <ListItem> got both `leading` and `icon`, and only `leading` will be ' +
        'drawn. They fill the same slot; `icon` is the shorthand for it.',
    );
  }

  if (__DEV__ && chevron && !onPress) {
    console.warn(
      '[@dashforge/rn] <ListItem> has a chevron and no `onPress`. A chevron says the row leads ' +
        'somewhere, so a row that draws one and does nothing is a promise nothing keeps.',
    );
  }

  if (!isVisible || !accessState.visible) return null;

  const resolve = listItemRecipe(tokens);
  const interactive = Boolean(onPress || onLongPress);
  // A row holds content; it does not take a value. RBAC's `'readonly'`
  // therefore only means anything when the row is pressable, where it
  // lands on inert like `'disable'`.
  const inactive = disabled || accessState.disabled || accessState.readonly;

  const before =
    leading ?? (Icon ? <Icon size={tokens.iconSize} color={tokens.color.icon} /> : null);

  const body = (pressed: boolean) => {
    const styles = resolve({ pressed: pressed && !inactive, divider });
    return (
      <>
        {/*
          Drawn by the row and positioned by the list. It takes no layout
          space, so a row is exactly as tall as its content says.
        */}
        {divider === 'none' ? null : (
          <View style={[styles.separator, sx?.separator]} />
        )}
        {before ? <View style={[styles.leading, sx?.leading]}>{before}</View> : null}
        <View style={[styles.body, sx?.body]}>
          {typeof title === 'string' ? (
            <Text numberOfLines={titleLines} style={[styles.title, sx?.title]}>
              {title}
            </Text>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <Text numberOfLines={subtitleLines} style={[styles.subtitle, sx?.subtitle]}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>
        {typeof value === 'string' ? (
          <Text numberOfLines={1} style={[styles.value, sx?.value]}>
            {value}
          </Text>
        ) : (
          value
        )}
        {trailing}
        {chevron ? <View style={[styles.chevron, sx?.chevron]} /> : null}
      </>
    );
  };

  if (!interactive) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        {...rest}
        style={[
          resolve({ divider }).root,
          inactive ? { opacity: theme.semantic.opacity.disabled } : null,
          sx?.root,
        ]}
      >
        {body(false)}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      onLongPress={onLongPress}
      {...rest}
      style={({ pressed }) => [
        resolve({ pressed: pressed && !inactive, divider }).root,
        // The ground moves and nothing shifts. A row is already a wide
        // flat target, and scaling one inside a list would drag the
        // hairlines around with it.
        //
        // Dimming means "unavailable" and nothing else, which is why it
        // is the only opacity token there is.
        inactive ? { opacity: theme.semantic.opacity.disabled } : null,
        sx?.root,
      ]}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

/**
 * A column of rows with a hairline between them.
 *
 * Thin on purpose: it owns the lines and nothing else. No ground, no
 * padding, no rounding, because a list is almost always inside something
 * that already decided those, and a list that decided them again would
 * have to be undone at every call site.
 *
 * @example
 * ```tsx
 * <Card padding="none">
 *   <List divider="inset">
 *     <ListItem icon={Bell} title="Notifiche" value="Attive" chevron onPress={…} />
 *     <ListItem icon={Globe} title="Lingua" value="Italiano" chevron onPress={…} />
 *   </List>
 * </Card>
 * ```
 */
export function List(props: ListProps) {
  const themeDefaults = useComponentDefaults('ListItem');
  const tokens = useComponentTokens('ListItem');

  const { children, divider = 'full', access, visibleWhen, sx, ...rest } = {
    ...themeDefaults,
    ...props,
  } as ListProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  return (
    <ListContext.Provider value={{ divider }}>
      {/*
        The hairline belongs to the row it sits above, and the list hides
        the first one by clipping it: the column is lifted by exactly the
        hairline's thickness, and what leaves the box is not drawn. The
        list ends up half a point shorter than its rows, which is the
        whole cost.

        The obvious implementation puts a separator between each pair of
        children instead. It cannot work here, because every component in
        this library can decide not to render: a row hidden by `access`
        or `visibleWhen` would leave its separators behind, two lines
        together where a row used to be. A row that renders nothing draws
        no hairline, and there is nothing to reconcile.
      */}
      <View {...rest} style={[{ overflow: 'hidden' }, sx?.root]}>
        <View style={{ marginTop: -tokens.separator.thickness }}>{children}</View>
      </View>
    </ListContext.Provider>
  );
}

List.Item = ListItem;
