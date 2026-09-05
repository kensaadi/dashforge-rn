/**
 * Small pieces the playground repeats. Deliberately built out of the
 * library's own components where it can: the shell is the first consumer
 * and the fastest way to notice something missing.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Typography } from '@dashforge/rn';

// `Card` used to be built here by hand, out of six semantic tokens, and
// the Surface section had a second copy of it. Both are gone: the
// library ships it, and re-exporting keeps every existing call site.
export { Card } from '@dashforge/rn';

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
