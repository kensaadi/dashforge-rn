import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

export interface SurfaceProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /**
   * The branches, as `<Surface.Case>` elements followed by an optional
   * `<Surface.Fallback>`.
   *
   * Source order is the priority and the first matching case wins, so
   * two cases being true at once is not a situation to handle, it is
   * unambiguous by construction. Anything that is not a branch is
   * ignored, with a warning in development.
   */
  children?: ReactNode;
  /**
   * How much this region may interrupt.
   *
   * Not a detail about animation: it is the editorial question of
   * whether the content has the right to change while the user is doing
   * something, and the rule for choosing is one line. **Interrupting is
   * legitimate when *not* seeing it costs the user something.** An
   * incoming ride request enters now, because delaying it for the
   * driver's scroll costs them money. A list of offers never has that
   * right, because missing it costs nothing.
   *
   * `'settled'` waits for the scroll to stop. It also applies at once,
   * and without a transition, when the region is below the fold: nothing
   * visible moves there, and waiting for it to come into view would make
   * content materialise as you arrive at it.
   *
   * **It needs a `<SurfaceViewport>` above it.** React Native has no
   * ambient notion of scrolling, so without one there is nothing to wait
   * for and this degrades to `'immediate'` with a warning in
   * development.
   *
   * @default 'settled'
   */
  commit?: 'immediate' | 'settled';
  /**
   * How a change of branch is shown.
   *
   * `'fade'` cross-fades: the outgoing branch leaves a little faster
   * than the incoming arrives, the incoming settles in from a hair
   * smaller, and the region's height is animated to the new content. A
   * dissolve rather than a slide, because nothing travelled from
   * anywhere: the region changed its mind.
   *
   * `'none'` swaps outright.
   *
   * The platform's reduce-motion setting overrides this to `'none'` on
   * its own. That is not a refinement: for some people the motion is
   * physically unpleasant, and the content still changes either way.
   *
   * @default 'fade'
   */
  transition?: 'fade' | 'none';
  /**
   * Style override on the region itself. Applied last, so it wins.
   * @default undefined
   */
  sx?: StyleProp<ViewStyle>;
}

export interface SurfaceCaseProps {
  /**
   * Whether this branch applies.
   *
   * A plain boolean, not a predicate over an injected store: the cases
   * are written inside your own render, where your state is already in
   * scope, so passing it in only to read it back out would be a layer
   * for nothing. Any state that causes a re-render works, and there is
   * nothing to adapt.
   */
  when: boolean;
  /**
   * What this branch shows. Not rendered until the branch wins: a case
   * that loses builds an element and never calls the component, so the
   * branches cost nothing until one is selected.
   */
  children?: ReactNode;
}

export interface SurfaceFallbackProps {
  /**
   * What the region shows when no case matches.
   *
   * Writing a fallback is what makes the region hold its place. Without
   * one it renders nothing and takes no height, and the siblings close
   * up. Both are first class: the fallback is not the poor case, it is
   * real content that steps aside when something arrives that deserves
   * the space more.
   */
  children?: ReactNode;
}
