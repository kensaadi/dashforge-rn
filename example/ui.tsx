/**
 * Small pieces the playground repeats. Deliberately built out of the
 * library's own components where it can: the shell is the first consumer
 * and the fastest way to notice something missing.
 */
import type { ReactNode } from 'react';
import { Stack, Typography } from '@dashforge/rn';
import type { StackGap } from '@dashforge/rn';

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

/**
 * Was hand-rolled flexbox until `Stack` existed. Kept as a name because
 * the playground says "a row of things" a lot, but it is the primitive
 * underneath now.
 */
export function Row({
  children,
  gap = 'inline',
}: {
  children: ReactNode;
  gap?: StackGap;
}) {
  return (
    <Stack direction="row" wrap gap={gap}>
      {children}
    </Stack>
  );
}
