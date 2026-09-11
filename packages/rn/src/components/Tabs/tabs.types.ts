import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import type { IconComponent } from '../Button/button.types';
import type { DashforgeProps } from '../_shared/dashforge.types';

/** What a tab's value may be. */
export type TabValue = string | number;

/** Per-slot style overrides on the group. */
export interface TabsSx {
  /** The strip and the panel together. */
  root?: StyleProp<ViewStyle>;
}

/** Per-slot style overrides on the strip. */
export interface TabsListSx {
  /** The strip, which is what carries the rail. */
  root?: StyleProp<ViewStyle>;
  /** The row of tabs inside it. */
  row?: StyleProp<ViewStyle>;
  /** The mark that travels under the selected tab. */
  indicator?: StyleProp<ViewStyle>;
}

/** Per-slot style overrides on one tab. */
export interface TabSx {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

export interface TabsProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /** The strip and the panels. */
  children?: ReactNode;
  /** Controlled selection. */
  value?: TabValue;
  /**
   * Uncontrolled initial selection. Ignored when `value` is given.
   * @default the first tab
   */
  defaultValue?: TabValue;
  /**
   * Told when a different tab is chosen.
   * @default undefined
   */
  onValueChange?: (value: TabValue) => void;
  /**
   * Disables every tab at once.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: TabsSx;
}

export interface TabsListProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /** The tabs. */
  children?: ReactNode;
  /**
   * How the tabs share the width.
   *
   * `fitted` divides it equally between them, which is what two or three
   * short words want. `scrollable` gives each one the width of its own
   * label and scrolls, which is what six want, and the selected one is
   * brought into view when it is chosen from elsewhere.
   *
   * @default 'fitted'
   */
  variant?: 'fitted' | 'scrollable';
  /**
   * What assistive technology calls the set.
   * @default undefined
   */
  accessibilityLabel?: string;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: TabsListSx;
}

export interface TabProps extends DashforgeProps {
  /** Which panel it opens. */
  value: TabValue;
  /** The word. Keep it to one. */
  label: string;
  /**
   * Drawn before the word, at the label's own colour so it follows the
   * selected state without being told.
   * @default undefined
   */
  icon?: IconComponent;
  /**
   * A count after the word. Pass a `Badge`; the tab only makes room.
   * @default undefined
   */
  badge?: ReactNode;
  /**
   * Inert on its own, whatever the group says.
   * @default false
   */
  disabled?: boolean;
  /**
   * Style overrides, per slot. Applied last, so they win.
   * @default undefined
   */
  sx?: TabSx;
}

export interface TabPanelProps extends Omit<ViewProps, 'style'>, DashforgeProps {
  /** Which tab shows it. */
  value: TabValue;
  /** The content. */
  children?: ReactNode;
  /**
   * Keep it mounted while another tab is selected, hidden rather than
   * gone.
   *
   * Off by default: an unselected panel costs nothing and a screen with
   * five of them mounted is five screens' worth of work on every render.
   * Turn it on for a panel holding a list whose scroll position, or a
   * form whose half-typed answers, should survive a look at the tab next
   * door.
   *
   * @default false
   */
  keepMounted?: boolean;
  /**
   * Style overrides. Applied last, so they win.
   * @default undefined
   */
  sx?: StyleProp<ViewStyle>;
}
