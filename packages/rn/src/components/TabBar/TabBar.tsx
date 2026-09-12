import { Pressable, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { TabBarProps } from './tabBar.types';

/**
 * The bar across the bottom of an application.
 *
 * **It renders and it does not navigate**, which is the same line
 * `Header` holds and the reason this is not `Tabs`. `Tabs` switches what
 * one screen shows and owns the switching; this says which screen you
 * are on and hands the press to whoever holds the navigator.
 *
 * Three to five destinations. Two is a `SegmentedControl` and six is a
 * drawer, and a bar of six words on a phone is six words nobody can
 * read.
 *
 * @example
 * ```tsx
 * <TabBar
 *   value={route}
 *   onValueChange={navigation.navigate}
 *   bottomInset={insets.bottom}
 *   items={[
 *     { value: 'home', label: 'Home', icon: Home },
 *     { value: 'inbox', label: 'Posta', icon: Mail, badge: <Badge count={3} color="danger" /> },
 *   ]}
 * />
 * ```
 */
export function TabBar(props: TabBarProps) {
  const themeDefaults = useComponentDefaults('TabBar');
  const tokens = useComponentTokens('TabBar');

  const {
    items,
    value,
    onValueChange,
    bottomInset = 0,
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as TabBarProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const groupInert = accessState.disabled || accessState.readonly;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      {...rest}
      style={[
        {
          paddingBottom: bottomInset,
          backgroundColor: tokens.color.bg,
          borderTopWidth: tokens.border.thickness,
          borderTopColor: tokens.border.color,
        },
        sx?.root,
      ]}
    >
      <View
        style={[
          { flexDirection: 'row', height: tokens.height, alignItems: 'stretch' },
          sx?.row,
        ]}
      >
        {items.map((item) => {
          const current = item.value === value;
          const inert = groupInert || item.disabled;
          const color = inert
            ? tokens.color.labelDisabled
            : current
              ? tokens.color.labelSelected
              : tokens.color.label;

          return (
            <Pressable
              key={String(item.value)}
              accessibilityRole="tab"
              // `selected` and not `checked`: a destination is a place
              // you are, not an answer you gave.
              accessibilityState={{ selected: current, disabled: inert }}
              accessibilityLabel={item.label}
              disabled={inert}
              onPress={() => onValueChange?.(item.value)}
              style={[
                {
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: tokens.gap,
                },
                sx?.item,
              ]}
            >
              {item.icon ? <item.icon size={tokens.iconSize} color={color} /> : null}
              <Text
                numberOfLines={1}
                style={[{ ...tokens.typography.label, color }, sx?.label]}
              >
                {item.label}
              </Text>
              {item.badge}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
