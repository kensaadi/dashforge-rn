import type { ReactNode } from 'react';

/** One choice on the sheet. */
export interface SheetChoice {
  /** What comes back when it is picked. */
  key: string;
  /** The word on it. */
  label: string;
  /**
   * Destructive: red on iOS, and the same here.
   * @default false
   */
  destructive?: boolean;
  /**
   * Inert. iOS greys it out and refuses it; so does the drawn one.
   * @default false
   */
  disabled?: boolean;
}

/** What to put on the sheet. */
export interface SheetRequest {
  /**
   * The question. Shown above the choices, small.
   * @default undefined
   */
  title?: string;
  /**
   * A line under the title, for the consequence.
   * @default undefined
   */
  message?: string;
  /** The choices, in the order they should be read. */
  options: SheetChoice[];
  /**
   * What the way out is called.
   * @default 'Annulla'
   */
  cancelLabel?: string;
}

/** The channel an application gets back from `createActionSheet()`. */
export interface ActionSheetApi {
  /**
   * Mount once, near the root and beside `DialogHost`.
   *
   * **On iOS it renders nothing.** The sheet there is the platform's
   * own, and the host exists so that the same call works on Android,
   * where there is no platform sheet to ask for.
   */
  ActionSheetHost: (props: { bottomInset?: number }) => ReactNode;
  /**
   * Ask, and wait for the answer.
   *
   * Resolves with the `key` of what was picked, or `null` when the
   * sheet was dismissed: **cancelling is an answer and it is not an
   * error**, for the same reason `ask()` resolves rather than rejects.
   */
  showActionSheet: (request: SheetRequest) => Promise<string | null>;
}
