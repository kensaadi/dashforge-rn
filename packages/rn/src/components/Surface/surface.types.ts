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
