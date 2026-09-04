/**
 * Small pieces the playground repeats. Deliberately built out of the
 * library's own components where it can: the shell is the first consumer
 * and the fastest way to notice something missing.
 */
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';

export function Card({ children }: { children: ReactNode }) {
  const s = useTheme().semantic;
  const style: ViewStyle = {
    backgroundColor: s.surface.raised,
    borderColor: s.border.default,
    borderWidth: s.borderWidth.default,
    borderRadius: s.radius.surface,
    padding: s.space.inset,
    gap: s.space.stack,
  };
  return <View style={style}>{children}</View>;
}

export function Label({ children }: { children: string }) {
  return <Typography variant="label">{children}</Typography>;
}

export function Caption({ children }: { children: string }) {
  return (
    <Typography variant="caption" color="muted">
      {children}
    </Typography>
  );
}

export function Row({
  children,
  gap = 8,
}: {
  children: ReactNode;
  gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {children}
    </View>
  );
}
