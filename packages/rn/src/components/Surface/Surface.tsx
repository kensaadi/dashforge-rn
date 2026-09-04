import { Animated } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import { selectBranch } from './selectBranch';
import { useBranchTransition } from './useBranchTransition';
import {
  BRANCH_MARKER,
  SURFACE_CASE,
  SURFACE_FALLBACK,
  type BranchComponent,
} from './surface.markers';
import type {
  SurfaceCaseProps,
  SurfaceFallbackProps,
  SurfaceProps,
} from './surface.types';

/**
 * A branch of a `Surface`. A descriptor, not a renderer: `Surface` reads
 * `when` and `children` off the element and renders the children itself,
 * so this component body only runs if somebody puts a case outside a
 * surface, where it has nothing to be a branch of.
 */
export function Case(_props: SurfaceCaseProps) {
  if (__DEV__) {
    console.warn(
      '[@dashforge/rn] <Surface.Case> was rendered outside a <Surface>, so nothing ' +
        'decides whether it applies and it renders nothing.',
    );
  }
  return null;
}
Case.displayName = 'Surface.Case';
(Case as BranchComponent)[BRANCH_MARKER] = SURFACE_CASE;

/** The branch shown when no case matches. A descriptor, like `Case`. */
export function Fallback(_props: SurfaceFallbackProps) {
  if (__DEV__) {
    console.warn(
      '[@dashforge/rn] <Surface.Fallback> was rendered outside a <Surface>, so there is ' +
        'nothing for it to fall back from and it renders nothing.',
    );
  }
  return null;
}
Fallback.displayName = 'Surface.Fallback';
(Fallback as BranchComponent)[BRANCH_MARKER] = SURFACE_FALLBACK;

/**
 * A region that can spend the same space more than once.
 *
 * A mobile screen is a fixed budget of space and the navigation model
 * spends it one question at a time, so a screen is mounted once and then
 * sits still: anything the application learns afterwards costs the user
 * a tap to go and find. A `Surface` is a place that already exists in
 * the layout and replaces its content when asynchronous business
 * knowledge arrives that makes better use of it.
 *
 * **Use one when it saves the user a click.** Without this region, would
 * they have had to navigate, search or tap to reach the information? If
 * yes, the space is earned. If no, it is decoration, and decoration that
 * moves on its own is noise. The library cannot judge content and does
 * not try; what it does is make absence the default, so filling the
 * region takes a condition that is actually true.
 *
 * Three properties do the work. Source order is the priority, so no
 * numbers and no scheduler: read down the list and you know what wins.
 * The first match wins, so two true cases are unambiguous rather than
 * handled. And the fallback answers "and if none of them", which is why
 * a silent hole is not expressible.
 *
 * Not a list: a view where a fourth card arrives is a collection that
 * grew, not a place that changed its mind. Not an overlay: an urgent
 * interruption that takes an area wherever you are looking is a bottom
 * sheet, which does its own job. And not for form fields, which are
 * `visibleWhen`'s business, because unmounting a field destroys what was
 * typed and raises the question of whether the value stays in the
 * payload.
 *
 * @example
 * ```tsx
 * <Surface>
 *   <Surface.Case when={details.ready}>
 *     <DetailedOptions items={details.items} />
 *   </Surface.Case>
 *   <Surface.Case when={details.pending}>
 *     <OfferOfTheMonth />
 *   </Surface.Case>
 *   <Surface.Fallback>
 *     <SkeletonCard />
 *   </Surface.Fallback>
 * </Surface>
 * ```
 */
export function Surface(props: SurfaceProps) {
  const { children, access, visibleWhen, transition = 'fade', sx, ...rest } = props;

  const theme = useTheme();
  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const reduceMotion = useReduceMotion();

  // Matching runs regardless, because it is cheap and because skipping it
  // would make the development warnings depend on who is looking.
  const { selected, byKey } = selectBranch(children);
  const hidden = !isVisible || !accessState.visible;

  const t = useBranchTransition(
    hidden ? null : (selected?.key ?? null),
    transition === 'fade' && !reduceMotion,
    // The incoming branch is the slower of the two, so the outgoing is
    // gone well before the new content has finished settling and there
    // is never a frame showing neither. A refinement is a real event and
    // wants to be read, which is why the entry is `deliberate` rather
    // than the `standard` used for a control reacting to a touch.
    { exit: theme.semantic.motion.standard, enter: theme.semantic.motion.deliberate },
  );

  const shown = t.shownKey === null ? null : byKey.get(t.shownKey);
  const outgoing = t.outgoingKey === null ? null : byKey.get(t.outgoingKey);

  if (hidden) return null;

  // Nothing matched, no fallback was written, and nothing is still
  // leaving: the region is not there at all. Rendering an empty view
  // instead would still apply whatever spacing `sx` carries, which is
  // the opposite of taking no space.
  if (t.shownKey === null && outgoing == null) return null;

  return (
    <Animated.View
      {...rest}
      style={[sx, t.animating ? { height: t.height, overflow: 'hidden' } : null]}
    >
      <Animated.View
        // The key is the branch's position, so changing branch replaces
        // the subtree rather than reconciling into it. Without it two
        // branches rendering the same component type would update in
        // place and the outgoing one would never unmount.
        key={t.shownKey ?? 'empty'}
        onLayout={t.onIncomingLayout}
        style={{
          opacity: t.incomingOpacity,
          transform: [{ scale: t.incomingScale }],
        }}
      >
        {shown}
      </Animated.View>
      {outgoing == null ? null : (
        // Overlaid rather than in flow, so the incoming branch can be
        // measured at its natural height while this one is still on
        // screen. Inert, because it is already gone as far as the user
        // is concerned.
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            opacity: t.outgoingOpacity,
          }}
        >
          {outgoing}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Attached rather than nested so the pair reads as one component at the
// call site. Both are exported above because declaration emit refuses to
// name a private function on a public surface (TS4033); the package index
// still exports only `Surface`, so the API is `Surface.Case`.
Surface.Case = Case;
Surface.Fallback = Fallback;
