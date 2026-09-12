import type { ReactNode } from 'react';
import type { ImageSourcePropType, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface ImageSx {
  /** The box, which is what holds the shape and the placeholder. */
  root?: StyleProp<ViewStyle>;
  /** The picture itself. */
  image?: StyleProp<ImageStyle>;
}

export interface ImageProps extends DashforgeProps {
  /** The picture. A remote one is fine. */
  source: ImageSourcePropType;
  /**
   * What it shows, for somebody who cannot see it.
   *
   * **Leave it out when the picture says nothing the words around it do
   * not already say.** A photograph beside a title that names it is
   * decoration, and the right outcome for decoration is to be skipped
   * rather than described.
   *
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * The shape, when no height is given. `16 / 9`, `1` for a square.
   * @default 16 / 9
   */
  aspectRatio?: number;
  /**
   * An explicit height, which wins over the shape.
   * @default undefined
   */
  height?: number;
  /**
   * An explicit width. Without one it fills what it was put in.
   * @default '100%'
   */
  width?: number | `${number}%`;
  /**
   * How the picture fills the box.
   * @default 'cover'
   */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /**
   * How rounded.
   * @default 'none'
   */
  radius?: RadiusStep;
  /**
   * Drawn while the picture is on its way. Without one the box is a
   * block of the placeholder colour, which is what most screens want and
   * why it is not a `Skeleton` by default: a page of breathing blocks is
   * a loading screen, and one picture arriving late is not.
   *
   * @default undefined
   */
  fallback?: ReactNode;
  /**
   * Drawn instead when the picture cannot be loaded. Without one the box
   * keeps the placeholder and a small mark, which is the honest thing to
   * show: something was meant to be here.
   *
   * @default undefined
   */
  errorFallback?: ReactNode;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: ImageSx;
}
