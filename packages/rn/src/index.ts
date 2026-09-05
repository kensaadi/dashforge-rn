/**
 * @dashforge/rn
 *
 * Token-first React Native UI library.
 *
 * Components live here. The theme runtime, the `sv()` style engine and
 * `useTheme()` are reached through `@dashforge/rn/theme`; token types and
 * the default themes through `@dashforge/rn/tokens`.
 *
 * Every rule this package is built to is in ARCHITECTURE.md at the repo
 * root. Read it before adding anything.
 */

export { Button } from './components/Button/Button';
export { Typography } from './components/Typography/Typography';
export { TextField } from './components/TextField/TextField';
export { Surface } from './components/Surface/Surface';
export { Card } from './components/Card/Card';
export { buttonRecipe } from './components/Button/button.variants';
export type {
  TypographyProps,
  TypographyVariant,
  TypographyColor,
} from './components/Typography/typography.types';
export type {
  TextFieldProps,
  TextFieldSx,
} from './components/TextField/textField.types';
export type {
  CardProps,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardHeaderSx,
} from './components/Card/card.types';
export type {
  SurfaceProps,
  SurfaceCaseProps,
  SurfaceFallbackProps,
} from './components/Surface/surface.types';
export type { DashforgeProps } from './components/_shared/dashforge.types';
export { useAccessState } from './hooks/useAccessState';
export { useVisibility, type VisibleWhen } from './hooks/useVisibility';

export type {
  ButtonProps,
  DashPressState,
  IconComponent,
} from './components/Button/button.types';

/**
 * Package version. Kept in step with `package.json` at release time and
 * exported so a host app can report which build it is running against.
 */
export const VERSION = '0.0.0';
