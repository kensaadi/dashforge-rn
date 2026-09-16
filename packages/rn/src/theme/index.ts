/**
 * @dashforge/rn/theme
 *
 * The theme runtime and the public styling API. Consumers build their own
 * components on these, so they are API and not internals.
 *
 * See ARCHITECTURE.md sections 7, 8 and 9.
 */

export { defineTheme } from './defineTheme';
export { sv, svSlots } from './sv';
export { createRecipe } from './createRecipe';
export { resolveTypeStyle } from './typography';
export { useComponentTokens, useComponentDefaults } from './useComponentTokens';
export { useTheme, useThemeMode } from './useTheme';
export {
  setMode,
  setTheme,
  toggleMode,
  patchTheme,
  getTheme,
  MODE_STORAGE_KEY,
} from './store';
export { DashforgeNativeProvider, type DashforgeNativeProviderProps } from './Provider';

export type {
  StyleObject,
  VariantMap,
  VariantProps,
  SlotVariantMap,
  SvConfig,
  SvSlotsConfig,
} from './sv';

export type {
  Theme,
  ThemeInput,
  Palette,
  DeepPartial,
  ModeStorage,
  DatePickerAdapter,
  DatePickerRequest,
  HapticsAdapter,
  HapticIntent,
} from './theme.types';
