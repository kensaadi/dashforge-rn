import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps } from 'react-native';

/** What the viewport knows at a given instant. */
export interface ViewportState {
  /** True from the first drag until the momentum stops. */
  scrolling: boolean;
  /** The viewport's top edge in window coordinates. */
  top: number;
  /** Its height. */
  height: number;
}

/**
 * The viewport, as a subscription rather than as values.
 *
 * **Deliberately not state.** A scroll fires dozens of times a second,
 * and putting its position in context would re-render every surface
 * under it on every frame to answer a question none of them is asking.
 * A surface subscribes only while it has a change waiting, and reads the
 * position once, at the moment it wants to commit.
 */
export interface ViewportApi {
  getState: () => ViewportState;
  subscribe: (listener: () => void) => () => void;
}

const ViewportCtx = createContext<ViewportApi | null>(null);

/**
 * A measurable host view.
 *
 * `View`'s ref is not `View` under the new architecture types, so the
 * component type is asked for its own instance rather than assumed.
 */
export type MeasurableView = ComponentRef<typeof View>;

/** The viewport a surface is inside, or `null` when nobody wired one. @internal */
export function useViewport(): ViewportApi | null {
  return useContext(ViewportCtx);
}

/** The props a scroll container has to be given for any of this to work. */
export interface SurfaceScrollProps {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: () => void;
  scrollEventThrottle: number;
  maintainVisibleContentPosition: ScrollViewProps['maintainVisibleContentPosition'];
}

export interface SurfaceViewportProps {
  /**
   * Given the props to spread onto whatever scrolls: a `ScrollView`, a
   * `FlatList`, a `SectionList`, anything that reports scrolling.
   */
  children: (scroll: SurfaceScrollProps) => ReactNode;
}

/**
 * Tells the surfaces inside it when the user is busy.
 *
 * **React Native has no ambient notion of "the user is scrolling"**, and
 * a region cannot know where it sits relative to a viewport it was not
 * told about. Without this, `commit="settled"` has nothing to wait for
 * and degrades to `immediate`, with a warning in development. That is a
 * limit of the platform, not something a component can paper over.
 *
 * A render prop rather than a wrapper around `ScrollView`, so the
 * consumer keeps their own scroll container: a list is not going to be
 * rewritten as a `ScrollView` to get this.
 *
 * The props it hands over include `maintainVisibleContentPosition`,
 * which is what keeps the line you are reading where it is when content
 * grows above it. Long-standing on iOS, later on Android, so it is worth
 * checking against the version in use.
 *
 * @example
 * ```tsx
 * <SurfaceViewport>
 *   {(scroll) => <ScrollView {...scroll}>{children}</ScrollView>}
 * </SurfaceViewport>
 * ```
 */
export function SurfaceViewport({ children }: SurfaceViewportProps) {
  const state = useRef<ViewportState>({ scrolling: false, top: 0, height: 0 });
  const listeners = useRef(new Set<() => void>());
  const box = useRef<ComponentRef<typeof View>>(null);

  const api = useMemo<ViewportApi>(
    () => ({
      getState: () => state.current,
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
    }),
    [],
  );

  const notify = () => {
    for (const listener of listeners.current) listener();
  };

  const setScrolling = (scrolling: boolean) => {
    if (state.current.scrolling === scrolling) return;
    state.current = { ...state.current, scrolling };
    notify();
  };

  const scroll: SurfaceScrollProps = {
    // The position is read from the layout at commit time, not from
    // here: this handler exists so that a scroll which never becomes a
    // drag, a wheel or a programmatic one, still counts as motion.
    onScroll: () => setScrolling(true),
    onScrollBeginDrag: () => setScrolling(true),
    // Not settled yet: letting go starts the momentum, and a change that
    // landed here would still move the ground under the finger.
    onScrollEndDrag: () => {},
    onMomentumScrollBegin: () => setScrolling(true),
    onMomentumScrollEnd: () => setScrolling(false),
    scrollEventThrottle: 16,
    maintainVisibleContentPosition: { minIndexForVisible: 0 },
  };

  // Measured in window coordinates rather than taken from the layout
  // event, because a surface measures itself the same way and the two
  // numbers have to be comparable. A layout `y` is relative to whatever
  // parent each of them happens to have.
  const onLayout = (_event: LayoutChangeEvent) => {
    box.current?.measureInWindow((_x, y, _width, height) => {
      state.current = { ...state.current, top: y, height };
    });
  };

  return (
    <ViewportCtx.Provider value={api}>
      <View ref={box} style={{ flex: 1 }} onLayout={onLayout}>
        {children(scroll)}
      </View>
    </ViewportCtx.Provider>
  );
}
