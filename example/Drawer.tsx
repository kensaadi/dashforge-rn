/**
 * The playground's navigation drawer.
 *
 * Built here on plain React Native, not with a library component: the
 * catalog lists a `Drawer` but it is not written, and writing one in a
 * hurry because the playground needs one is how a component ends up
 * designed around a demo. When it lands properly, this becomes its first
 * consumer and goes away.
 *
 * A drawer rather than a fixed sidebar because 402 points is the whole
 * screen: a permanent column eats half of it.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';

const WIDTH = 268;

const FILL: {
  position: 'absolute';
  left: number;
  right: number;
  top: number;
  bottom: number;
} = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 };

export interface DrawerGroup<K extends string> {
  label: string;
  items: ReadonlyArray<{ key: K; label: string }>;
}

export interface DrawerProps<K extends string> {
  open: boolean;
  onClose: () => void;
  /**
   * Grouped rather than flat. A list stops being scannable somewhere
   * around eight entries and every component added makes it longer, so
   * the structure belongs here before the list needs it, not after.
   */
  groups: ReadonlyArray<DrawerGroup<K>>;
  active: K;
  onSelect: (key: K) => void;
}

export function Drawer<K extends string>({
  open,
  onClose,
  groups,
  active,
  onSelect,
}: DrawerProps<K>) {
  const insets = useSafeAreaInsets();
  const s = useTheme().semantic;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      // Durations come from the motion tokens, like everything else that
      // moves. `standard` to open, `quick` to close: a panel that takes
      // as long to leave as to arrive feels reluctant.
      duration: open ? s.motion.standard : s.motion.quick,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, progress, s.motion.standard, s.motion.quick]);

  return (
    // `pointerEvents` follows `open` rather than the animation, so a
    // closed drawer never swallows a touch meant for the content behind.
    <View
      pointerEvents={open ? 'auto' : 'none'}
      style={{ ...FILL, zIndex: s.zIndex.overlay }}
    >
      <Animated.View
        style={{ ...FILL, backgroundColor: s.overlay.scrim, opacity: progress }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityLabel="Chiudi il menu"
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: WIDTH,
          backgroundColor: s.surface.overlay,
          borderRightColor: s.border.default,
          borderRightWidth: s.borderWidth.default,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-WIDTH, 0],
              }),
            },
          ],
        }}
      >
        <View style={{ paddingHorizontal: s.space.inset, paddingBottom: 8 }}>
          <Typography variant="subtitle">Playground</Typography>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {groups.map(group => (
            <View key={group.label}>
              <View
                style={{
                  paddingHorizontal: s.space.inset,
                  paddingTop: 14,
                  paddingBottom: 4,
                }}
              >
                <Typography variant="caption" color="muted">
                  {group.label}
                </Typography>
              </View>

              {group.items.map(item => {
                const selected = item.key === active;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onSelect(item.key);
                      onClose();
                    }}
                    style={{
                      minHeight: 44,
                      justifyContent: 'center',
                      paddingHorizontal: s.space.inset,
                      backgroundColor: selected
                        ? s.action.primary.bgSubtlePressed
                        : 'transparent',
                      borderLeftWidth: 3,
                      borderLeftColor: selected
                        ? s.action.primary.bg
                        : 'transparent',
                    }}
                  >
                    <Typography
                      variant="label"
                      sx={{
                        color: selected
                          ? s.action.primary.fgSubtle
                          : s.text.secondary,
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
