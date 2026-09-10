import { RefreshControl } from 'react-native';
import type { ReactElement } from 'react';
import { useComponentTokens } from '../theme/useComponentTokens';

export interface RefreshOptions {
  /** Whether the work is still going. */
  refreshing: boolean;
  /** Started by the pull. Called once per pull, not once per frame. */
  onRefresh: () => void;
  /**
   * What assistive technology reads while it turns.
   * @default undefined
   */
  accessibilityLabel?: string;
}

/**
 * Pull to refresh, as a hook rather than a component.
 *
 * **Because React Native gives no other way.** The refresh control is a
 * *prop* of a scroll view, not something that can be rendered around
 * one, so a `<PullToRefresh>` wrapper could not reach the list it was
 * wrapping. The three shapes a caller might have, a `ScrollView`, a
 * `FlatList` and this library's own `SurfaceViewport`, all take the same
 * prop, and a hook fits all three without any of them knowing about it.
 *
 * The alternative was a component that owned a scroll view of its own,
 * which would have made three scroll containers in one library and left
 * the `FlatList` case, the one ARCHITECTURE.md requires for a long list,
 * with nothing.
 *
 * The colours come from the theme, which is the only part of this the
 * platform leaves to us: iOS reads `tint` and Android draws the arc in
 * it on a disc of `background`.
 *
 * @example
 * ```tsx
 * const refresh = useRefreshControl({ refreshing, onRefresh: reload });
 * return <FlatList data={rows} renderItem={…} refreshControl={refresh} />;
 * ```
 */
export function useRefreshControl(options: RefreshOptions): ReactElement {
  const tokens = useComponentTokens('Refresh');
  const { refreshing, onRefresh, accessibilityLabel } = options;

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // iOS takes one colour, Android takes a list and a disc behind it.
      // Stated for both rather than left to the platform default, which
      // is a grey that belongs to no theme.
      tintColor={tokens.tint}
      colors={[tokens.tint]}
      progressBackgroundColor={tokens.background}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
