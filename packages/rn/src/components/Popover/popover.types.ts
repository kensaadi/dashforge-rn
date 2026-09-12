import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface PopoverSx {
  /** The layer that catches the tap. */
  scrim?: StyleProp<ViewStyle>;
  /** The panel. */
  panel?: StyleProp<ViewStyle>;
  /** The point that ties it to its anchor. */
  arrow?: StyleProp<ViewStyle>;
}

export interface PopoverProps extends DashforgeProps {
  /**
   * What it comes out of, rendered where it was written. The popover
   * measures it rather than asking the caller for a ref, because a ref
   * that has to be threaded through is a ref somebody forgets.
   */
  anchor: ReactNode;
  /** What is in it. */
  children?: ReactNode;
  /** Whether it is showing. */
  open: boolean;
  /**
   * Asked to close, by a tap outside or the back button. **It does not
   * close itself**, like `Modal` and `BottomSheet`: the caller keeps the
   * state that says whether it is open.
   */
  onClose?: () => void;
  /**
   * Which side of the anchor it prefers. It goes to the other one when
   * there is not enough room, which there often is not near the bottom
   * of a phone.
   *
   * @default 'bottom'
   */
  placement?: 'top' | 'bottom';
  /**
   * Draw the point that ties it to its anchor.
   * @default true
   */
  arrow?: boolean;
  /**
   * The panel's name for assistive technology.
   * @default undefined
   */
  label?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: PopoverSx;
}
