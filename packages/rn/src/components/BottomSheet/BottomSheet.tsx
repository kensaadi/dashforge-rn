import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { CardContext } from '../Card/Card';
import type { BottomSheetProps } from './bottomSheet.types';

/** Enough movement to be a drag rather than a tap that wandered. */
const DRAG_SLOP = 4;

/**
 * Whether letting go here means "go away".
 *
 * Pulled out of the responder because that is where the judgement is,
 * and a judgement inside a gesture closure is a judgement nothing can
 * check: React Native's test renderer does not run `PanResponder`, so
 * the alternative was verifying this on a device by feel.
 *
 * Two ways to qualify, and the second is the one that matters. Distance
 * alone would make a short hard flick spring back, and a flick is an
 * intention: the finger left the screen already moving away.
 *
 * @internal
 */
export function shouldDismiss(
  gesture: { dy: number; vy: number },
  sheetHeight: number,
  limits: { dismissRatio: number; dismissVelocity: number },
): boolean {
  const farEnough = gesture.dy > sheetHeight * limits.dismissRatio;
  const fastEnough = gesture.vy > limits.dismissVelocity;
  return farEnough || fastEnough;
}

/**
 * How far ahead a release is read, in milliseconds.
 *
 * A finger that lets go while still moving means to keep going, so the
 * detent is chosen from where the sheet *would* be rather than where it
 * is. Without this a slow drag and a flick that covered the same ground
 * land in the same place, and only one of them meant to.
 */
const PROJECTION_MS = 120;

/**
 * Which detent a release lands on.
 *
 * Pure for the same reason `shouldDismiss` is: it is the judgement, and
 * a judgement inside a gesture closure is one nothing can check.
 *
 * @param offsets How far down each detent sits, in the order the snap
 *   points were given.
 * @param position Where the sheet is now, in the same units.
 * @param vy Downward speed in points per millisecond.
 * @returns The index of the detent to settle on.
 * @internal
 */
export function nearestSnap(
  offsets: readonly number[],
  position: number,
  vy: number,
): number {
  const projected = position + vy * PROJECTION_MS;
  let best = 0;
  for (let i = 1; i < offsets.length; i += 1) {
    if (Math.abs(offsets[i] - projected) < Math.abs(offsets[best] - projected)) {
      best = i;
    }
  }
  return best;
}

/**
 * A panel that comes up from the bottom edge and can be pushed back down.
 *
 * **The hard part is not the animation, it is the arbitration.** React
 * Native hands a gesture to the first view that claims it and does not
 * take it back mid-drag, so a sheet that grabs every downward swipe has
 * broken every scroll view inside it, and one that grabs none cannot be
 * dragged at all. There is no arrangement that is right for both.
 *
 * So the choice is named rather than guessed: `dragFrom="handle"`, the
 * default, makes the grabber and the strip around it the only drag
 * target, and everything below keeps its own gestures. `anywhere` makes
 * the whole sheet draggable and is for content that does not scroll.
 *
 * The drag target takes the touch at down-press rather than waiting to
 * see a drag, because inside a `Modal` this platform never offers the
 * later chance. Buttons inside the sheet are unaffected: the deepest
 * view under the finger is asked first, so only the inert space between
 * them reaches the sheet.
 *
 * **It does not close itself**, like `Modal`: the scrim, the back button
 * and a drag that went far enough all call `onClose` and nothing else
 * happens until the caller says so. A sheet that is not dismissible
 * still moves under the finger and springs back, because refusing to
 * move at all would be pretending not to be a sheet.
 *
 * `Card.Header` and `Card.Footer` work inside, on the card context the
 * sheet lends them, exactly as they do in a dialog.
 *
 * @example
 * ```tsx
 * <BottomSheet open={open} onClose={close} label="Ordina per" bottomInset={insets.bottom}>
 *   <Card.Header title="Ordina per" />
 *   <RadioGroup value={sort} onValueChange={setSort}>…</RadioGroup>
 * </BottomSheet>
 * ```
 */
export function BottomSheet(props: BottomSheetProps) {
  const themeDefaults = useComponentDefaults('BottomSheet');
  const tokens = useComponentTokens('BottomSheet');
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const {
    open,
    onClose,
    dismissible = true,
    dragFrom = 'handle',
    radius = 'none',
    showHandle = true,
    snapPoints,
    initialSnap = 0,
    onSnapChange,
    bottomInset = 0,
    label,
    children,
    access,
    visibleWhen,
    sx,
  } = { ...themeDefaults, ...props } as BottomSheetProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const reduceMotion = useReduceMotion();

  /**
   * How far the sheet has to get out of the keyboard's way.
   *
   * iOS only. On Android the window under a modal is resized by
   * `adjustResize` and the sheet, which is anchored to the bottom of
   * that window, has already moved: lifting it again would lift it
   * twice.
   */
  const keyboard = useKeyboardHeight();
  const lift = Platform.OS === 'ios' ? keyboard : 0;

  const hidden = !isVisible || !accessState.visible;
  const wanted = open && !hidden;

  /** The two corners that are not against the screen's edge. */
  const corner = tokens.radius[radius];

  /**
   * How far down the sheet is, in points. `0` is up, its own height is
   * off the bottom edge.
   *
   * On the JS driver and not the native one, because a drag writes to it
   * with `setValue` from JavaScript and a value cannot be driven from
   * both places. The scrim's opacity is interpolated from the same value
   * so the page brightens as the sheet is pushed away, which is the
   * thing that makes a drag feel attached to something.
   */
  const travel = useRef(new Animated.Value(0)).current;

  const [presented, setPresented] = useState(wanted);
  const [sheetHeight, setSheetHeight] = useState(screenHeight);
  const [snapIndex, setSnapIndex] = useState(initialSnap);

  const held = useRef<ReactNode>(children);
  if (wanted) held.current = children;

  /**
   * The geometry of the whole thing, in one place.
   *
   * **A detent is a translation, not a height.** With snap points the
   * sheet is laid out once at its tallest and a smaller detent slides
   * the rest below the screen's edge, so a drag is one value moving and
   * never a re-layout per frame. The cost is that the content is
   * anchored to the top: at a partial detent the sheet's own bottom,
   * `bottomInset` and any `Card.Footer` are off-screen. Put a list in a
   * sheet that snaps and a footer in one that does not.
   */
  const expanded = snapPoints
    ? screenHeight * snapPoints[snapPoints.length - 1]!
    : sheetHeight;
  /** How far down a detent sits. The tallest one sits at zero. */
  const offsetOf = (index: number) =>
    snapPoints ? expanded - screenHeight * snapPoints[index]! : 0;
  const offsets = snapPoints ? snapPoints.map((_, i) => offsetOf(i)) : undefined;
  /** Where it rests now, where the smallest detent rests, and off-screen. */
  const rest = offsetOf(Math.min(snapIndex, (snapPoints?.length ?? 1) - 1));
  const lowestRest = offsetOf(0);
  const gone = expanded;

  /**
   * What the responder needs to know, kept in a ref.
   *
   * `PanResponder.create` runs once, so its callbacks close over the
   * first render's values forever. Reading them from here is what stops
   * a sheet from dismissing against a stale `dismissible`.
   */
  const live = useRef({
    dismissible,
    onClose,
    onSnapChange,
    sheetHeight,
    snapPoints,
    snapIndex,
    offsets,
    rest,
    lowestRest,
    gone,
    screenHeight,
    tokens,
    /** Where the sheet was when the finger went down. */
    from: 0,
  });
  live.current = {
    ...live.current,
    dismissible,
    onClose,
    onSnapChange,
    sheetHeight,
    snapPoints,
    snapIndex,
    offsets,
    rest,
    lowestRest,
    gone,
    screenHeight,
    tokens,
  };

  const settle = (to: number, then?: () => void) => {
    if (reduceMotion) {
      travel.setValue(to);
      then?.();
      return;
    }
    Animated.timing(travel, {
      toValue: to,
      duration: theme.semantic.motion.standard,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) then?.();
    });
  };

  useEffect(() => {
    if (wanted) {
      // A sheet that comes back comes back where it started, not where
      // it was left: the detent was an answer to the last visit.
      setSnapIndex(initialSnap);
      setPresented(true);
      travel.setValue(gone);
      settle(offsetOf(initialSnap));
      return;
    }
    settle(gone, () => setPresented(false));
    // The geometry is deliberately out: a re-measure mid-animation would
    // restart the entrance from wherever it had got to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, reduceMotion]);

  const responder = useRef(
    PanResponder.create({
      // At touch-down, in the bubble phase, which is the only phase that
      // is actually offered here.
      //
      // The obvious implementation claims on the first move instead, so a
      // press stays a press and only a real drag takes the gesture. It
      // does not work: inside a `Modal` this platform never runs the
      // move-phase negotiation at all. Measured, not assumed, with a
      // counter on the screen: touch-down reaches
      // `onStartShouldSetPanResponderCapture` and a full drag reaches
      // `onMoveShouldSetPanResponder` zero times. Grant at touch-down and
      // the same drag arrives intact.
      //
      // Bubbling is what makes this safe. React Native asks the deepest
      // view under the finger first and stops at the first yes, so a
      // button inside the sheet still wins its own press and only the
      // inert space between them falls through to here.
      onStartShouldSetPanResponder: () => true,
      // Kept for the case this cannot reach: a descendant already holds
      // the gesture and the finger turns it into a drag. Where the
      // platform runs it, this asks for the handover.
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dy) > DRAG_SLOP && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      // Where it was when the finger went down, so a drag from a partial
      // detent moves from there and not from the top.
      onPanResponderGrant: () => {
        live.current.from = live.current.rest;
      },
      // Up is allowed only as far as the tallest detent, down only as far
      // as gone. Without snap points the tallest detent is the only one
      // and this is the old rule: pulling up does nothing, because
      // stretching a sheet away from the edge it belongs to is not a
      // thing a sheet does.
      onPanResponderMove: (_event, gesture) => {
        const { from, gone: away } = live.current;
        travel.setValue(Math.min(Math.max(from + gesture.dy, 0), away));
      },
      onPanResponderRelease: (_event, gesture) => {
        const {
          dismissible: can,
          onClose: close,
          onSnapChange: told,
          offsets: stops,
          snapPoints: points,
          snapIndex: at,
          lowestRest: floor,
          screenHeight: screen,
          sheetHeight: h,
          gone: away,
          from,
          tokens: t,
        } = live.current;

        const land = (to: number) =>
          Animated.spring(travel, {
            toValue: to,
            useNativeDriver: false,
            bounciness: 0,
          }).start();

        if (!stops || !points) {
          if (can && shouldDismiss(gesture, h, t)) {
            close?.();
            return;
          }
          // Also the path a plain tap takes, since a tap is a grant with
          // nowhere to go: it springs back from zero and nothing moves.
          land(0);
          return;
        }

        // Dismissal is measured against the smallest detent, from where
        // that detent rests: a quarter of the sheet the user can see, not
        // a quarter of the tallest one it could have been.
        const position = Math.min(Math.max(from + gesture.dy, 0), away);
        const escaping = { dy: position - floor, vy: gesture.vy };
        if (can && shouldDismiss(escaping, screen * points[0]!, t)) {
          close?.();
          return;
        }

        const next = nearestSnap(stops, position, gesture.vy);
        if (next !== at) {
          setSnapIndex(next);
          told?.(next);
        }
        land(stops[next]!);
      },
      // Keep the gesture once it is ours: handing it back mid-drag
      // leaves the sheet stranded wherever the finger was.
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  if (__DEV__ && snapPoints) {
    const ok =
      snapPoints.length > 0 &&
      snapPoints.every((f, i) => f > 0 && f <= 1 && (i === 0 || f > snapPoints[i - 1]!));
    if (!ok) {
      console.warn(
        '[@dashforge/rn] <BottomSheet> snapPoints must be fractions of the screen in (0, 1], ' +
          `strictly ascending. Got [${snapPoints.join(', ')}], and the detents will not line up.`,
      );
    }
    if (initialSnap < 0 || initialSnap > snapPoints.length - 1) {
      console.warn(
        `[@dashforge/rn] <BottomSheet> initialSnap ${initialSnap} is outside snapPoints, ` +
          'so the sheet will open on the nearest detent it has.',
      );
    }
  }

  if (__DEV__ && !showHandle && dragFrom === 'handle') {
    console.warn(
      '[@dashforge/rn] <BottomSheet> has showHandle={false} with dragFrom="handle", so the ' +
        'only thing that can be dragged is also the only thing that is invisible. Show the ' +
        'handle, or set dragFrom="anywhere".',
    );
  }

  const dismiss = () => {
    if (dismissible) onClose?.();
  };

  /** More than one detent is what makes the sheet resizable at all. */
  const resizable = !!snapPoints && snapPoints.length > 1;

  const goToSnap = (next: number) => {
    if (!snapPoints || next === snapIndex) return;
    setSnapIndex(next);
    onSnapChange?.(next);
    settle(offsetOf(next));
  };

  const onSheetLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    if (measured > 0 && measured !== sheetHeight) setSheetHeight(measured);
  };

  const dragHandlers = responder.panHandlers;

  return (
    <RNModal
      transparent
      visible={presented}
      // Ours from end to end, so the scrim and the sheet move together
      // and the modal stops being presented exactly when the exit ends.
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      {/*
        The sheet sits on the keyboard rather than under it.
        
        Scrolling the content inside was not enough and is not what the
        platform does: iOS brings the caret into view and no more, so a
        four-line field showed one line and going to a new line pushed
        the text back out of sight. A sheet with a field in it has to
        move, which is what every native compose sheet does.
      */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: lift }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              // Brightens as the sheet is pushed away, which is what
              // makes the drag feel attached to something.
              // From the smallest detent, not from the current one: a
              // sheet at any detent is fully here, and only the stretch
              // below the smallest one is on its way out. Reading it
              // from the current detent would make the scrim jump every
              // time the sheet resized.
              opacity: travel.interpolate({
                inputRange: [lowestRest, Math.max(gone, lowestRest + 1)],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            onPress={dismiss}
            style={[StyleSheet.absoluteFill, { backgroundColor: tokens.scrim }, sx?.scrim]}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={label}
          onLayout={onSheetLayout}
          {...(dragFrom === 'anywhere' ? dragHandlers : {})}
          style={[
            {
              // With detents the height is the tallest one and the rest
              // is translation; without them the sheet is as tall as its
              // content, up to the cap.
              ...(snapPoints
                ? { height: expanded }
                : { maxHeight: screenHeight * tokens.maxHeightRatio }),
              // The cap is applied again over the top of a detent's
              // height: a sheet at nine tenths of the screen with the
              // keyboard up does not fit, and the half that would not
              // fit is its heading.
              maxHeight: screenHeight * tokens.maxHeightRatio - lift,
              backgroundColor: tokens.bg,
              // Only the top corners: the bottom is the screen's edge.
              borderTopLeftRadius: corner,
              borderTopRightRadius: corner,
              paddingHorizontal: tokens.padding,
              // The safe-area inset is for the home indicator, and while
              // the keyboard is up the keyboard is over it. Keeping both
              // would leave a band of empty sheet on top of the keys.
              paddingBottom: tokens.padding + (lift > 0 ? 0 : bottomInset),
              gap: tokens.gap,
              ...tokens.elevation,
              transform: [{ translateY: travel }],
            },
            sx?.sheet,
          ]}
        >
          {showHandle ? (
            <View
              // The drag target when `dragFrom` is `handle`: the strip
              // across the top, not just the four points of the bar,
              // because a grabber you have to hit exactly is a grabber
              // that does not work.
              //
              // The strip is also the button, rather than wrapping one:
              // a drag is not a gesture a screen reader can perform, so
              // without this a sheet reached through VoiceOver has a
              // scrim it cannot see and a gesture it cannot make. A
              // `Pressable` here would take the touch at down-press and
              // leave the visible bar, the one place a thumb aims for,
              // as the one place that cannot be dragged.
              {...(dragFrom === 'handle' ? dragHandlers : {})}
              // The bar and its margins come to twenty points, which is
              // half a touch target. The sheet leaves a gap of its own
              // below the strip, so the target grows down into space
              // that is already empty and never reaches the content.
              hitSlop={{ bottom: tokens.gap }}
              accessible={dismissible || resizable}
              accessibilityRole={dismissible ? 'button' : undefined}
              accessibilityLabel={
                dismissible ? 'Chiudi' : resizable ? 'Maniglia del foglio' : undefined
              }
              onAccessibilityTap={dismissible ? dismiss : undefined}
              // Resizing is a drag, and a drag is not a gesture a reader
              // can make. Without these the detents exist only for
              // people who can pull them.
              accessibilityActions={
                resizable
                  ? [
                      { name: 'expand', label: 'Espandi' },
                      { name: 'collapse', label: 'Riduci' },
                    ]
                  : undefined
              }
              onAccessibilityAction={
                resizable
                  ? event =>
                      goToSnap(
                        event.nativeEvent.actionName === 'expand'
                          ? Math.min(snapIndex + 1, snapPoints!.length - 1)
                          : Math.max(snapIndex - 1, 0),
                      )
                  : undefined
              }
              style={{ alignItems: 'center' }}
            >
              <View
                style={[
                  {
                    width: tokens.handle.width,
                    height: tokens.handle.height,
                    borderRadius: tokens.handle.height,
                    backgroundColor: tokens.handle.color,
                    marginVertical: tokens.handle.marginVertical,
                  },
                  sx?.handle,
                ]}
              />
            </View>
          ) : null}

          <CardContext.Provider
            value={{
              padding: tokens.padding,
              radius: corner,
              tone: 'neutral',
              over: 'card',
            }}
          >
            {wanted ? children : held.current}
          </CardContext.Provider>
        </Animated.View>
      </View>
    </RNModal>
  );
}
