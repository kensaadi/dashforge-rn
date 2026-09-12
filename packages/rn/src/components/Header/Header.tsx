import { Pressable, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { HeaderProps } from './header.types';

/**
 * The bar across the top of a screen.
 *
 * **It renders and it does not navigate.** `onBack` is told that the
 * arrow was pressed; what that means is the caller's, because the
 * navigator is theirs. ARCHITECTURE.md is explicit that this library
 * does not reimplement a router, and a header that called `goBack()`
 * would have reimplemented the only part of one anybody notices.
 *
 * The safe-area inset is a prop for the same reason it is everywhere
 * else here: this package has no dependency that could read it, and
 * inventing a number for the notch is how a bar ends up under the
 * clock on exactly one phone.
 *
 * A centred title is the iOS look and one against the leading edge is
 * the Android one. The choice is the caller's rather than the
 * platform's, because appearance is bucket one and bucket one is ours
 * on both.
 *
 * @example
 * ```tsx
 * <Header title="Ordini" topInset={insets.top} onBack={navigation.goBack}
 *         actions={<IconButton icon={Search} onPress={open} accessibilityLabel="Cerca" />} />
 * ```
 */
export function Header(props: HeaderProps) {
  const themeDefaults = useComponentDefaults('Header');
  const tokens = useComponentTokens('Header');

  const {
    title,
    subtitle,
    onBack,
    backLabel = 'Indietro',
    leading,
    actions,
    topInset = 0,
    centerTitle = false,
    divider = true,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as HeaderProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const before =
    leading ??
    (onBack ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        hitSlop={12}
        style={[{ padding: 4 }, sx?.back]}
      >
        {/*
          Two edges of a square, turned to point the way out. Drawn from
          views: this package ships no icon set.
        */}
        <View
          style={{
            width: tokens.back.size,
            height: tokens.back.size,
            borderLeftWidth: tokens.back.thickness,
            borderBottomWidth: tokens.back.thickness,
            borderColor: tokens.color.tint,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </Pressable>
    ) : null);

  const heading = (
    <View
      style={{
        flex: 1,
        gap: 1,
        alignItems: centerTitle ? 'center' : 'flex-start',
      }}
    >
      {typeof title === 'string' ? (
        // Announced as a heading, so heading navigation lands on the
        // name of the screen.
        <Text
          numberOfLines={1}
          accessibilityRole="header"
          style={[{ ...tokens.typography.title, color: tokens.color.title }, sx?.title]}
        >
          {title}
        </Text>
      ) : (
        title
      )}
      {typeof subtitle === 'string' ? (
        <Text
          numberOfLines={1}
          style={[
            { ...tokens.typography.subtitle, color: tokens.color.subtitle },
            sx?.subtitle,
          ]}
        >
          {subtitle}
        </Text>
      ) : (
        subtitle
      )}
    </View>
  );

  return (
    <View
      {...rest}
      style={[
        {
          paddingTop: topInset,
          backgroundColor: tokens.color.bg,
          borderBottomWidth: divider ? tokens.border.thickness : 0,
          borderBottomColor: tokens.border.color,
          ...tokens.elevation,
        },
        sx?.root,
      ]}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.gap,
            height: tokens.height,
            paddingHorizontal: tokens.paddingHorizontal,
          },
          sx?.row,
        ]}
      >
        {before}
        {heading}
        {actions}
      </View>
    </View>
  );
}
