import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { swipeableRowRecipe } from './swipeableRow.variants';
import type { SwipeableRowProps } from './swipeableRow.types';

/**
 * The one row that is open, anywhere in the application.
 *
 * A module-level slot and not a provider, on purpose: a swipeable row
 * has to close the last one even when the two are in different lists on
 * different screens, and a provider that has to be mounted for that to
 * work is a rule that breaks quietly the first time somebody forgets it.
 * The same reasoning `Surface`'s stagger slot is built on.
 *
 * @internal
 */
let openRow: (() => void) | null = null;

/**
 * Whether letting go here means "stay open".
 *
 * Pulled out of the responder because that is where the judgement is,
 * and a judgement inside a gesture closure is one nothing can check:
 * React Native's test renderer does not run `PanResponder`.
 *
 * Two ways to qualify, as with the sheet. Distance alone would make a
 * short hard flick spring back, and a flick is an intention.
 *
 * @internal
 */
export function shouldOpen(
  gesture: { dx: number; vx: number },
  revealed: number,
  limits: { openRatio: number; openVelocity: number },
  towards: 'left' | 'right',
): boolean {
  // Normalised so the rule reads the same in both directions.
  const travelled = towards === 'left' ? -gesture.dx : gesture.dx;
  const speed = towards === 'left' ? -gesture.vx : gesture.vx;
  return travelled > revealed * limits.openRatio || speed > limits.openVelocity;
}

/**
 * A row with something hidden either side of it.
 *
 * **The hard part is the arbitration, again, and this time the answer is
 * the opposite of the sheet's.** A `BottomSheet` claims the gesture at
 * touch-down because inside a `Modal` nothing else is offered. A row in a
 * list cannot: claiming at touch-down would swallow every tap and stop
 * the list scrolling. So this one claims on the first move and only when
 * the movement is clearly sideways, which is what leaves a vertical drag
 * to the scroll view underneath.
 *
 * That is also why it is a separate component from `ListItem` rather
 * than a prop on it. A row that can be swiped has a gesture to arbitrate
 * and a layer to translate, and a row that cannot should carry neither.
 *
 * **One row is open at a time**, across the whole application: opening
 * this one closes whatever was open before, which is what both platforms
 * do and what stops a list from filling up with half-open rows.
 *
 * A swipe is not a gesture a screen reader can make, so every action is
 * also an accessibility action on the row: they are reachable from the
 * rotor without the row ever being opened.
 *
 * **The travelling layer paints a ground**, unlike the `ListItem` inside
 * it, which deliberately paints none. A row that slides over its own
 * actions cannot be transparent or it shows them through itself while
 * closed. The token guesses `surface.raised`, which is right for a list
 * inside a card; `sx.content` is the escape for a list somewhere else.
 *
 * @example
 * ```tsx
 * <SwipeableRow
 *   rightActions={[{ key: 'del', label: 'Elimina', color: 'danger', onPress: remove }]}
 * >
 *   <ListItem title="Kenjy Saadi" subtitle="Amministratore" />
 * </SwipeableRow>
 * ```
 */
export function SwipeableRow(props: SwipeableRowProps) {
  const themeDefaults = useComponentDefaults('SwipeableRow');
  const tokens = useComponentTokens('SwipeableRow');
  const theme = useTheme();

  const {
    children,
    rightActions,
    leftActions,
    onOpenChange,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as SwipeableRowProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const reduceMotion = useReduceMotion();

  const right = rightActions ?? [];
  const left = leftActions ?? [];
  const rightWidth = right.length * tokens.actionWidth;
  const leftWidth = left.length * tokens.actionWidth;

  /** How far the content has travelled. Negative is towards the left. */
  const travel = useRef(new Animated.Value(0)).current;
  const [side, setSide] = useState<'left' | 'right' | null>(null);

  /**
   * What the responder needs to know, kept in a ref.
   *
   * `PanResponder.create` runs once, so its callbacks close over the
   * first render's values forever.
   */
  const live = useRef({
    rightWidth,
    leftWidth,
    tokens,
    reduceMotion,
    onOpenChange,
    /** Where the content was when the finger went down. */
    from: 0,
    /** Which side is showing, so a second swipe starts from there. */
    side: null as 'left' | 'right' | null,
  });
  live.current = {
    ...live.current,
    rightWidth,
    leftWidth,
    tokens,
    reduceMotion,
    onOpenChange,
    side,
  };

  const settle = (to: number, then?: () => void) => {
    if (live.current.reduceMotion) {
      travel.setValue(to);
      then?.();
      return;
    }
    Animated.spring(travel, {
      toValue: to,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start(({ finished }) => {
      if (finished) then?.();
    });
  };

  const close = useRef(() => {});
  close.current = () => {
    if (openRow === close.current) openRow = null;
    if (live.current.side !== null) live.current.onOpenChange?.(false);
    setSide(null);
    live.current.side = null;
    settle(0);
  };

  const open = (to: 'left' | 'right') => {
    // Whatever was open somewhere else closes first, which is what stops
    // a list from filling up with half-open rows.
    if (openRow && openRow !== close.current) openRow();
    openRow = close.current;
    setSide(to);
    live.current.side = to;
    live.current.onOpenChange?.(true);
    settle(to === 'right' ? -live.current.rightWidth : live.current.leftWidth);
  };
  const openRef = useRef(open);
  openRef.current = open;

  // A row that goes away with its actions showing would leave the slot
  // pointing at a function nobody can reach.
  useEffect(
    () => () => {
      if (openRow === close.current) openRow = null;
    },
    [],
  );

  const responder = useRef(
    PanResponder.create({
      // Never at touch-down. This is the opposite of `BottomSheet`, and
      // for the opposite reason: a row lives inside a scroll view, and a
      // row that took every touch would swallow the taps and stop the
      // list moving.
      onStartShouldSetPanResponder: () => false,
      // On the first move, and only when the movement is clearly
      // sideways. Everything else is left to whatever is scrolling.
      onMoveShouldSetPanResponder: (_event, gesture) => {
        const { rightWidth: r, leftWidth: l, tokens: t } = live.current;
        if (r === 0 && l === 0) return false;
        if (Math.abs(gesture.dx) < t.slop) return false;
        return Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderGrant: () => {
        const { side: at, rightWidth: r, leftWidth: l } = live.current;
        live.current.from = at === 'right' ? -r : at === 'left' ? l : 0;
      },
      onPanResponderMove: (_event, gesture) => {
        const { from, rightWidth: r, leftWidth: l } = live.current;
        // Only as far as there is something to reveal. A row with
        // nothing on its left does not move to the right at all, rather
        // than rubber-banding towards an empty space.
        travel.setValue(Math.min(Math.max(from + gesture.dx, -r), l));
      },
      onPanResponderRelease: (_event, gesture) => {
        const { from, rightWidth: r, leftWidth: l, tokens: t } = live.current;
        const at = Math.min(Math.max(from + gesture.dx, -r), l);

        if (at < 0 && r > 0) {
          if (shouldOpen(gesture, r, t, 'left')) openRef.current('right');
          else close.current();
          return;
        }
        if (at > 0 && l > 0) {
          if (shouldOpen(gesture, l, t, 'right')) openRef.current('left');
          else close.current();
          return;
        }
        close.current();
      },
      // Keep the gesture once it is ours: handing it back mid-swipe
      // leaves the row stranded wherever the finger was.
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  if (!isVisible || !accessState.visible) return null;

  const styles = swipeableRowRecipe(tokens)();
  const inactive = accessState.disabled || accessState.readonly;

  const run = (action: { onPress: () => void }) => {
    close.current();
    action.onPress();
  };

  const panel = (actions: typeof right, at: 'left' | 'right') =>
    actions.length === 0 ? null : (
      <View style={[styles.panel, at === 'right' ? { right: 0 } : { left: 0 }]}>
        {actions.map((action) => {
          const role = tokens.color[action.color ?? 'secondary'];
          const Icon = action.icon;
          return (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              disabled={inactive}
              onPress={() => run(action)}
              style={[styles.action, { backgroundColor: role.bg }, sx?.action]}
            >
              {Icon ? <Icon size={20} color={role.fg} /> : null}
              <Text
                numberOfLines={1}
                style={[styles.actionLabel, { color: role.fg }, sx?.actionLabel]}
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );

  return (
    <View
      // Every action is also an accessibility action, because a swipe is
      // not a gesture a reader can make. Without these the actions exist
      // only for people who can perform the gesture that reveals them.
      accessibilityActions={[...left, ...right].map((a) => ({
        name: a.key,
        label: a.label,
      }))}
      onAccessibilityAction={(event) => {
        const found = [...left, ...right].find((a) => a.key === event.nativeEvent.actionName);
        if (found && !inactive) found.onPress();
      }}
      {...rest}
      style={[styles.root, sx?.root]}
    >
      {panel(left, 'left')}
      {panel(right, 'right')}

      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.content,
          { transform: [{ translateX: travel }] },
          inactive ? { opacity: theme.semantic.opacity.disabled } : null,
          sx?.content,
        ]}
      >
        {children}
        {side === null ? null : (
          // While the actions are showing, a touch on the row closes it
          // instead of reaching what is underneath. Tapping straight
          // through to a row whose actions are open is how somebody
          // opens the wrong thing.
          <Pressable
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            onPress={() => close.current()}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
    </View>
  );
}
