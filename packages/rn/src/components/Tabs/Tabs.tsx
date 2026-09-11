import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { tabsRecipe } from './tabs.variants';
import type {
  TabPanelProps,
  TabProps,
  TabValue,
  TabsListProps,
  TabsProps,
} from './tabs.types';

/** Where a tab sits in its row, once it has been laid out. */
interface TabLayout {
  x: number;
  width: number;
}

const TabsContext = createContext<{
  value: TabValue | undefined;
  select: (next: TabValue) => void;
  disabled: boolean;
  /** A tab reports where it landed, so the mark knows where to travel. */
  report: (value: TabValue, layout: TabLayout) => void;
  /** The first tab registers itself as the default when nobody chose one. */
  claimDefault: (value: TabValue) => void;
} | null>(null);

/** @internal Used by `Tabs.List`, `Tabs.Tab` and `Tabs.Panel`. */
function useTabs(component: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(
      `[@dashforge/rn] <${component}> has to be inside a <Tabs>. It reads the selection from ` +
        'there, and on its own it has nothing to show.',
    );
  }
  return context;
}

/**
 * One thing at a time, in the space of one.
 *
 * **This is not navigation.** It switches what a screen shows; it does
 * not move between screens, and it has no idea a router exists.
 * ARCHITECTURE.md is explicit that navigation belongs to
 * react-navigation and that this library does not reimplement a router,
 * so a tab bar at the bottom of an application is `TabBar`, a different
 * component that renders and does not navigate. This is the strip inside
 * a screen: all, unread, archived.
 *
 * It is also **not a form field**, which is what separates it from
 * `RadioGroup` even though both are one answer among several. A radio
 * group is an answer that ends up in a payload; a tab is a view of
 * something, and the engine has no business knowing which one is open.
 *
 * @example
 * ```tsx
 * <Tabs value={tab} onValueChange={setTab}>
 *   <Tabs.List>
 *     <Tabs.Tab value="all" label="Tutti" />
 *     <Tabs.Tab value="unread" label="Non letti" badge={<Badge count={3} />} />
 *   </Tabs.List>
 *   <Tabs.Panel value="all"><Inbox /></Tabs.Panel>
 *   <Tabs.Panel value="unread" keepMounted><Unread /></Tabs.Panel>
 * </Tabs>
 * ```
 */
export function Tabs(props: TabsProps) {
  const themeDefaults = useComponentDefaults('Tabs');
  const tokens = useComponentTokens('Tabs');

  const {
    children,
    value: controlledValue,
    defaultValue,
    onValueChange,
    disabled = false,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as TabsProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const [uncontrolled, setUncontrolled] = useState<TabValue | undefined>(defaultValue);
  const layouts = useRef(new Map<TabValue, TabLayout>()).current;
  // Bumped when a tab reports where it landed. The mark cannot travel to
  // a place nobody has measured yet, and the first measurement arrives a
  // frame after the first render.
  const [measured, setMeasured] = useState(0);

  const value = controlledValue ?? uncontrolled;

  const select = (next: TabValue) => {
    if (controlledValue === undefined) setUncontrolled(next);
    if (next !== value) onValueChange?.(next);
  };

  // The first tab is the selection when nobody named one, so the common
  // case needs no `defaultValue` and no empty first render.
  const claimDefault = (first: TabValue) => {
    setUncontrolled((current) => current ?? first);
  };

  const report = (tab: TabValue, layout: TabLayout) => {
    const known = layouts.get(tab);
    if (known && known.x === layout.x && known.width === layout.width) return;
    layouts.set(tab, layout);
    setMeasured((n) => n + 1);
  };

  if (!isVisible || !accessState.visible) return null;

  return (
    <TabsContext.Provider
      value={{
        value,
        select,
        disabled: disabled || accessState.disabled || accessState.readonly,
        report,
        claimDefault,
      }}
    >
      <LayoutsContext.Provider value={{ layouts, measured }}>
        <View {...rest} style={[{ gap: tokens.gap }, sx?.root]}>
          {children}
        </View>
      </LayoutsContext.Provider>
    </TabsContext.Provider>
  );
}

/**
 * The measurements, kept apart from the selection.
 *
 * Two contexts rather than one because they change on different clocks:
 * the selection changes when somebody presses a tab, and the layouts
 * change on the frame after any of them is measured. A panel that read
 * one object would re-render for the other.
 *
 * @internal
 */
const LayoutsContext = createContext<{
  layouts: Map<TabValue, TabLayout>;
  measured: number;
} | null>(null);

/**
 * How the strip shares its width, which a tab has to know.
 *
 * Set by the list rather than by `Tabs`, because it is the strip's
 * decision, and read by each tab because `flex: 1` belongs on the tab
 * and not on the row. Without it a scrolling strip's tabs still took an
 * equal share of a width they were supposed to overflow.
 *
 * @internal
 */
const ListContext = createContext<{ variant: 'fitted' | 'scrollable' }>({
  variant: 'fitted',
});

/**
 * The strip.
 *
 * @internal Reached as `Tabs.List`.
 */
export function TabsList(props: TabsListProps) {
  const tokens = useComponentTokens('Tabs');
  const { value } = useTabs('Tabs.List');
  const layoutsContext = useContext(LayoutsContext)!;
  const reduceMotion = useReduceMotion();

  const {
    children,
    variant = 'fitted',
    accessibilityLabel,
    access,
    visibleWhen,
    sx,
    ...rest
  } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const x = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;
  const scroller = useRef<ScrollViewInstance>(null);
  /** Nothing to travel from on the first measurement: it starts there. */
  const placed = useRef(false);

  const { layouts, measured } = layoutsContext;
  const target = value === undefined ? undefined : layouts.get(value);

  useEffect(() => {
    if (!target) return;

    if (!placed.current || reduceMotion) {
      placed.current = true;
      x.setValue(target.x);
      width.setValue(target.width);
    } else {
      // On the JS driver, and it has to be: `width` is a layout property
      // and cannot be driven natively, and one view cannot have half its
      // animation on each driver.
      Animated.parallel([
        Animated.timing(x, {
          toValue: target.x,
          duration: tokens.duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(width, {
          toValue: target.width,
          duration: tokens.duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }

    // A tab chosen from somewhere else, a deep link or a "see all", may
    // be off the side of a scrolling strip. Bringing it in costs nothing
    // when it is already there.
    if (variant === 'scrollable') {
      scroller.current?.scrollTo({ x: Math.max(0, target.x - tokens.paddingHorizontal), animated: !reduceMotion });
    }
    // `measured` is in the list on purpose: the layout of the selected
    // tab can change without the selection changing, when the strip is
    // measured for the first time or the screen is rotated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, measured, reduceMotion, variant]);

  if (!isVisible || !accessState.visible) return null;

  const styles = tabsRecipe(tokens)({ variant });

  const row = (
    <View style={[styles.row, sx?.row]}>
      <ListContext.Provider value={{ variant }}>{children}</ListContext.Provider>
      <Animated.View
        // Decoration: the selected tab already says it is selected, and
        // a reader that stopped on a moving line would be told nothing.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.indicator, { transform: [{ translateX: x }], width }, sx?.indicator]}
      />
    </View>
  );

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      {...rest}
      style={[styles.list, sx?.root]}
    >
      {variant === 'scrollable' ? (
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          // The row is as wide as its tabs, which is what gives the
          // scroll view something longer than itself to scroll.
          contentContainerStyle={{ flexGrow: 0 }}
        >
          {row}
        </ScrollView>
      ) : (
        row
      )}
    </View>
  );
}
TabsList.displayName = 'Tabs.List';

/**
 * One tab.
 *
 * @internal Reached as `Tabs.Tab`.
 */
export function Tab(props: TabProps) {
  const tokens = useComponentTokens('Tabs');
  const { value: selected, select, disabled: groupDisabled, report, claimDefault } =
    useTabs('Tabs.Tab');
  const { variant } = useContext(ListContext);

  const { value, label, icon: Icon, badge, disabled = false, access, visibleWhen, sx } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const first = useRef(false);
  useEffect(() => {
    if (first.current) return;
    first.current = true;
    claimDefault(value);
    // Mount only: whichever tab mounts first is the one that claims it,
    // and the claim is ignored once anything is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isVisible || !accessState.visible) return null;

  const inactive = disabled || groupDisabled || accessState.disabled || accessState.readonly;
  const isSelected = selected === value;
  const resolve = tabsRecipe(tokens);

  const onLayout = (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    report(value, { x, width });
  };

  const state = inactive ? 'disabled' : isSelected ? 'selected' : 'rest';
  const labelColor = resolve({ state }).label.color as string;

  return (
    <Pressable
      accessibilityRole="tab"
      // `selected` and not `checked`: a tab is a view, and the two are
      // read out differently.
      accessibilityState={{ selected: isSelected, disabled: inactive }}
      disabled={inactive}
      onPress={() => select(value)}
      onLayout={onLayout}
      style={({ pressed }) => [
        resolve({ variant, state, pressed: pressed && !inactive }).tab,
        sx?.root,
      ]}
    >
      {Icon ? <Icon size={18} color={labelColor} /> : null}
      <Text numberOfLines={1} style={[resolve({ variant, state }).label, sx?.label]}>
        {label}
      </Text>
      {badge}
    </Pressable>
  );
}
Tab.displayName = 'Tabs.Tab';

/**
 * What one tab shows.
 *
 * @internal Reached as `Tabs.Panel`.
 */
export function TabPanel(props: TabPanelProps) {
  const { value: selected } = useTabs('Tabs.Panel');
  const { value, children, keepMounted = false, access, visibleWhen, sx, ...rest } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const open = selected === value;
  if (!open && !keepMounted) return null;

  return (
    <View
      accessibilityRole="tabpanel"
      // Hidden and not merely invisible: a panel left in the reading
      // order is four screens of content a reader has to walk past to
      // reach the one that is open.
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      {...rest}
      style={[open ? null : { display: 'none' }, sx]}
    >
      {children}
    </View>
  );
}
TabPanel.displayName = 'Tabs.Panel';

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
