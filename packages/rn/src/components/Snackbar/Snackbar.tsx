import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text } from 'react-native';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../theme/useTheme';
import { useComponentTokens } from '../../theme/useComponentTokens';
import { resolveTypeStyle } from '../../theme/typography';
import type { DialogKind } from '../Modal/dialog.types';
import type { SnackbarProps } from './snackbar.types';

/** How far it travels on its way in. Enough to read as arriving. */
const RISE = 16;

function groundFor(
  kind: DialogKind,
  color: ReturnType<typeof useComponentTokens<'Snackbar'>>['color'],
): { bg: string; fg: string } {
  switch (kind) {
    case 'success':
      return { bg: color.bgSuccess, fg: color.fgOnTone };
    case 'warning':
      return { bg: color.bgWarning, fg: color.fgOnTone };
    case 'danger':
      return { bg: color.bgDanger, fg: color.fgOnTone };
    case 'info':
      return { bg: color.bgInfo, fg: color.fgOnTone };
    default:
      return { bg: color.bg, fg: color.fg };
  }
}

/**
 * A line of text that says what just happened, and goes away.
 *
 * **Not a `Modal`, and that is the whole difference.** A modal takes the
 * window and the touches with it; a notification that stopped you
 * touching the screen while it passed would be a dialog in disguise. It
 * sits in the app's own tree, at the bottom, and everything around it
 * stays live.
 *
 * The neutral ground is inverted, which is what a notification looks
 * like on both platforms: it reads as the app speaking rather than as a
 * piece of the page.
 *
 * One action at most. A notification is not a decision, and a row of
 * choices that vanishes on a timer is a decision you can lose by reading
 * slowly.
 *
 * @example
 * ```tsx
 * <Snackbar message="Progetto salvato" offset={insets.bottom} />
 * ```
 */
export function Snackbar(props: SnackbarProps) {
  const tokens = useComponentTokens('Snackbar');
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { message, kind = 'neutral', actionLabel, onAction, offset = 0, sx } = props;

  const entry = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      entry.setValue(1);
      return;
    }
    Animated.timing(entry, {
      toValue: 1,
      duration: theme.semantic.motion.standard,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entry, reduceMotion, theme.semantic.motion.standard]);

  const ground = groundFor(kind, tokens.color);

  return (
    <Animated.View
      // Announced when it arrives rather than waiting to be found: a
      // notification the reader has to go looking for has already
      // failed at the one thing it does.
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        {
          position: 'absolute',
          left: tokens.margin,
          right: tokens.margin,
          bottom: offset + tokens.margin,
          alignSelf: 'center',
          maxWidth: tokens.maxWidth,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.gap,
          padding: tokens.padding,
          borderRadius: tokens.radius,
          backgroundColor: ground.bg,
          ...tokens.elevation,
          opacity: entry,
          transform: [
            {
              translateY: entry.interpolate({
                inputRange: [0, 1],
                outputRange: [RISE, 0],
              }),
            },
          ],
        },
        sx?.root,
      ]}
    >
      <Text
        style={[
          { ...resolveTypeStyle(tokens.typography), color: ground.fg, flexShrink: 1 },
          sx?.message,
        ]}
      >
        {message}
      </Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          // The strip is short and the label inside it shorter, so the
          // target has to be grown rather than the notification.
          hitSlop={12}
        >
          <Text
            style={[
              {
                ...resolveTypeStyle(tokens.typography),
                color: ground.fg,
                fontWeight: '700',
              },
              sx?.action,
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
