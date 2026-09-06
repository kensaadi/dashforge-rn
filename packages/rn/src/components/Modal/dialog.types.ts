import type { ComponentType, ReactNode } from 'react';
import type { ButtonProps } from '../Button/button.types';
import type {
  Notification,
  NotificationAction,
} from '../Snackbar/snackbar.types';

/**
 * The contract for asking a question from code, with no JSX anywhere on
 * the asking side.
 *
 * **Types only, deliberately.** The inference is the part that either
 * works or does not, and finding out after an implementation exists is
 * finding out late.
 *
 * Two shapes, one function. A *question* is a closed record: a title,
 * some words, and the answers it offers. A *registered dialog* is a name
 * and its props, for when the dialog is really a piece of interface. The
 * first covers most of it and never touches a component; the second puts
 * the JSX where it belongs, in the view layer, behind a name that the
 * business layer can hold without importing anything.
 *
 * What is deliberately absent is a block list: an array of typed nodes
 * resolved into components is Blueprint with fewer steps and worse, on
 * the wrong side of the boundary between the server contract and the
 * component API. When the Blueprint RN SDK arrives it will produce a
 * `Question` from its own contract, which is a pure function and touches
 * no components at all.
 */

/** Which of the feedback roles the dialog wears. */
export type DialogKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * One of the answers a question offers.
 *
 * `value` is what comes back, so it is the answer and not a callback:
 * every action closes, and which one was pressed is the resolved value.
 * Nothing in a question needs to reach the dialog to shut it.
 */
export interface DialogAction<V extends string = string> {
  /** Returned by `ask` when this one is pressed. */
  value: V;
  label: string;
  /** @default 'primary' on the last action, 'secondary' on the others */
  color?: ButtonProps['color'];
  /** @default 'solid' on the last action, 'ghost' on the others */
  variant?: ButtonProps['variant'];
}

/** A question: a closed record, translatable, serialisable, no JSX. */
export interface Question<
  A extends readonly DialogAction[] = readonly DialogAction[],
> {
  /**
   * What the affirmative answer is coloured, and nothing else.
   *
   * Deliberately small: a dialog that tinted its whole panel by kind
   * would be shouting, and both platforms settle this the same way, by
   * colouring the button that does the thing. `danger` makes the last
   * action red; `neutral` leaves it the primary colour.
   *
   * @default 'neutral'
   */
  kind?: DialogKind;
  title: string;
  /** @default undefined */
  message?: string;
  /** In order. The last one is the affirmative one and reads as such. */
  actions: A;
  /**
   * Whether the scrim and the back button may answer `null`.
   * @default true
   */
  dismissible?: boolean;
}

/**
 * What a registered dialog is given so it can end itself.
 *
 * Here a callback is right, where in a question it would be wrong: a
 * registered dialog *is* view code, and knowing how to close is part of
 * being the thing on screen.
 */
export interface DialogProps<R = void> {
  /** Ends the dialog, resolving `ask` with what it is given. */
  close: (value?: R) => void;
}

/** A dialog the app registered under a name. */
export type DialogComponent<P extends object = object, R = void> = ComponentType<
  P & DialogProps<R>
>;

/** The props a registered dialog wants, minus the one the host supplies. */
export type DialogPropsOf<C> = C extends ComponentType<infer P>
  ? Omit<P, 'close'>
  : never;

/**
 * What a registered dialog resolves with, read off its own `close`.
 *
 * Taken from the prop rather than from a second type parameter, because
 * an intersection cannot be split back apart: `ComponentType<P & Closer<R>>`
 * gives no way to recover `R`, while `P['close']` does.
 */
export type DialogResultOf<C> = C extends ComponentType<infer P>
  ? P extends { close: (value?: infer R) => void }
    ? R
    : void
  : void;

/** Asking for a dialog the app registered. */
export interface DialogRequest<N extends string = string, P = unknown> {
  dialog: N;
  /** @default undefined */
  props?: P;
}

/**
 * Ask, and wait for the answer.
 *
 * `R` is the application's own map of name to dialog component. It is
 * constrained only to `object`, on purpose: a constraint tight enough to
 * describe a registry is also tight enough to reject valid members,
 * since a component's props sit in a contravariant position and there is
 * no `any` in this package to paper over it. The precise types come back
 * out through the conditionals below, at the call site, where they are
 * the ones that matter.
 *
 * `null` means the dialog was closed without answering, and is not
 * confusable with any answer: an action's `value` is a string, and a
 * registered dialog that resolves nothing resolves `undefined`.
 *
 * **A second call while one is open rejects.** Two dialogs never
 * coexist, so a second ask is a defect in the caller rather than
 * something to queue: queueing would hide it and reorder business logic
 * nobody wrote that way. A rejection surfaces in an `async` flow, which
 * is what a defect should do; resolving `null` instead would read as
 * "closed without answering" and skip the action in silence.
 */
export interface Ask<R extends object> {
  <const A extends readonly DialogAction[]>(
    question: Question<A>,
  ): Promise<A[number]['value'] | null>;

  <N extends keyof R & string>(
    request: DialogRequest<N, DialogPropsOf<R[N]>>,
  ): Promise<DialogResultOf<R[N]> | null>;
}

/**
 * Tell, and do not wait.
 *
 * The counterpart of `Ask`, and the opposite on every rule that matters.
 * Two notifications **queue** rather than being a defect: "salvato" and
 * "sincronizzato" are two true things, and dropping one drops
 * information, where two dialogs at once is somebody's mistake.
 *
 * The promise is there for the undo case and is optional to await: it
 * resolves with the action's value if it was pressed, and `null` if the
 * notification simply went away. Awaiting one with no action means
 * waiting for it to expire, which is almost never what you want.
 */
export interface Notify {
  (message: string): Promise<null>;
  <const A extends NotificationAction | undefined>(
    notification: Notification<A>,
  ): Promise<(A extends NotificationAction ? A['value'] : never) | null>;
}

/** What `createDialogs` hands back. One per application. */
export interface DialogApi<R extends object> {
  /**
   * The layer, mounted once at the root and empty until asked. It is the
   * only thing that decides whether a dialog is open, which is the whole
   * reason it is a provider rather than a component you place.
   */
  DialogHost: ComponentType<{
    children?: ReactNode;
    /**
     * How far off the bottom edge a notification sits. The safe-area
     * inset goes here: this package has no dependency that could read it
     * for you, and guessing it would be wrong on half the devices.
     * @default 0
     */
    bottomInset?: number;
  }>;
  /**
   * Usable outside React, which is the point: a store or a service asks
   * without importing a component or a hook.
   */
  ask: Ask<R>;
  /** The same function, for code that is already inside a component. */
  useDialog: () => Ask<R>;
  /**
   * Says something without asking anything. Same channel, because a
   * notification raised while a dialog is up would be behind it: the
   * host holds the queue until the dialog has gone.
   */
  notify: Notify;
}
