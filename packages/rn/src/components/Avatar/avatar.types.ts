import type {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';
import type { IconComponent } from '../Button/button.types';
import type { RadiusStep } from '../../tokens/components';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** Per-slot style overrides. */
export interface AvatarSx {
  /** The circle. */
  root?: StyleProp<ViewStyle>;
  /** The picture, when there is one. */
  image?: StyleProp<ImageStyle>;
  /** The initials, when there is not. */
  initials?: StyleProp<TextStyle>;
}

/** The steps an avatar comes in. */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends Omit<ViewProps, 'style' | 'children'>, DashforgeProps {
  /**
   * The picture. A remote one is fine; if it fails to load the avatar
   * falls back to the initials rather than leaving a hole.
   * @default undefined
   */
  source?: ImageSourcePropType;
  /**
   * Who it is. Used for the initials when there is no picture, and read
   * out by assistive technology unless `accessibilityLabel` says
   * otherwise.
   * @default undefined
   */
  name?: string;
  /**
   * The last fallback, when there is neither a picture nor a name.
   * @default undefined
   */
  icon?: IconComponent;
  /**
   * How big.
   * @default 'md'
   */
  size?: AvatarSize;
  /**
   * How rounded, named from the radius scale. A circle by default,
   * because that is what a face is drawn in; `md` or `lg` is the shape
   * an organisation or a product usually wants.
   * @default 'full'
   */
  radius?: RadiusStep;
  /**
   * What assistive technology reads instead of the name.
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: AvatarSx;
}
