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
export { Textarea } from './components/Textarea/Textarea';
export { NumberField } from './components/NumberField/NumberField';
export { Surface } from './components/Surface/Surface';
export { SurfaceViewport } from './components/Surface/SurfaceViewport';
export { KeyboardAvoidingContainer } from './components/KeyboardAvoidingContainer/KeyboardAvoidingContainer';
export { IconButton } from './components/IconButton/IconButton';
export { Stack } from './components/Stack/Stack';
export { Card } from './components/Card/Card';
export { Snackbar } from './components/Snackbar/Snackbar';
export { Modal } from './components/Modal/Modal';
export { BottomSheet } from './components/BottomSheet/BottomSheet';
export { List, ListItem } from './components/ListItem/ListItem';
export { Tabs } from './components/Tabs/Tabs';
export { SwipeableRow } from './components/SwipeableRow/SwipeableRow';
export { Divider } from './components/Divider/Divider';
export { Avatar } from './components/Avatar/Avatar';
export { Badge } from './components/Badge/Badge';
export { Spinner } from './components/Spinner/Spinner';
export { Skeleton } from './components/Skeleton/Skeleton';
export { EmptyState } from './components/EmptyState/EmptyState';
export { createDialogs } from './components/Modal/createDialogs';
export { Checkbox } from './components/Checkbox/Checkbox';
export { Switch } from './components/Switch/Switch';
export { RadioGroup } from './components/RadioGroup/RadioGroup';
export { Select } from './components/Select/Select';
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
export type { TextareaProps, TextareaSx } from './components/Textarea/textarea.types';
export type {
  NumberFieldProps,
  NumberFieldSx,
} from './components/NumberField/numberField.types';
export type {
  CardProps,
  CardCoverProps,
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
export type {
  SurfaceViewportProps,
  SurfaceScrollProps,
} from './components/Surface/SurfaceViewport';
export type {
  CheckboxProps,
  CheckboxSx,
} from './components/Checkbox/checkbox.types';
export type { SwitchProps, SwitchSx } from './components/Switch/switch.types';
export type {
  RadioGroupProps,
  RadioGroupSx,
  RadioOptionProps,
  RadioOptionSx,
  RadioValue,
} from './components/RadioGroup/radioGroup.types';
export type { IconButtonProps } from './components/IconButton/iconButton.types';
export type { StackProps, StackGap } from './components/Stack/stack.types';
export type {
  Notification,
  NotificationAction,
  SnackbarProps,
  SnackbarSx,
} from './components/Snackbar/snackbar.types';
export type { ModalProps, ModalSx } from './components/Modal/modal.types';
export type {
  BottomSheetProps,
  BottomSheetRadius,
  BottomSheetSx,
} from './components/BottomSheet/bottomSheet.types';
export type { DividerProps, DividerSx } from './components/Divider/divider.types';
export type { AvatarProps, AvatarSize, AvatarSx } from './components/Avatar/avatar.types';
export type { BadgeProps, BadgeSx } from './components/Badge/badge.types';
export type { SpinnerProps, SpinnerSx } from './components/Spinner/spinner.types';
export type {
  EmptyStateProps,
  EmptyStateSx,
} from './components/EmptyState/emptyState.types';
export type {
  SkeletonProps,
  SkeletonSx,
  SkeletonTextProps,
  SkeletonTextSx,
} from './components/Skeleton/skeleton.types';
export type {
  TabPanelProps,
  TabProps,
  TabSx,
  TabValue,
  TabsListProps,
  TabsListSx,
  TabsProps,
  TabsSx,
} from './components/Tabs/tabs.types';
export type {
  SwipeAction,
  SwipeableRowProps,
  SwipeableRowSx,
} from './components/SwipeableRow/swipeableRow.types';
export type {
  ListDivider,
  ListItemProps,
  ListItemSx,
  ListProps,
  ListSx,
} from './components/ListItem/listItem.types';
export type {
  Ask,
  DialogAction,
  DialogApi,
  DialogComponent,
  DialogKind,
  DialogProps,
  DialogPropsOf,
  DialogRequest,
  DialogResultOf,
  Notify,
  Question,
} from './components/Modal/dialog.types';
export type {
  SelectProps,
  SelectOptionProps,
  SelectSx,
} from './components/Select/select.types';
export type {
  KeyboardAvoidingContainerProps,
  KeyboardAvoidingContainerSx,
} from './components/KeyboardAvoidingContainer/keyboardAvoidingContainer.types';
export type { DashforgeProps } from './components/_shared/dashforge.types';
export { useAccessState } from './hooks/useAccessState';
export { useKeyboardHeight } from './hooks/useKeyboardHeight';
export { useRefreshControl, type RefreshOptions } from './hooks/useRefreshControl';
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
