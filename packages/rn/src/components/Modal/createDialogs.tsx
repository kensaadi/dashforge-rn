import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Snackbar } from '../Snackbar/Snackbar';
import { Typography } from '../Typography/Typography';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Modal } from './Modal';
import type {
  Notification,
  NotificationAction,
} from '../Snackbar/snackbar.types';
import type {
  Ask,
  DialogAction,
  DialogApi,
  DialogKind,
  Notify,
  Question,
} from './dialog.types';

/** The affirmative answer's colour, per kind. Nothing else changes. */
const KIND_COLOR: Record<DialogKind, 'primary' | 'success' | 'warning' | 'danger'> =
  {
    neutral: 'primary',
    info: 'primary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
  };

/** What the host is showing, and who is waiting for the answer. */
interface Pending {
  request: Question | { dialog: string; props?: object };
  settle: (value: unknown) => void;
}

/** One thing waiting to be said, and how long it gets to say it. */
interface Queued {
  notification: Notification<NotificationAction | undefined>;
  duration: number;
  settle: (value: unknown) => void;
}

/** Replaced whole on every change, so the store's snapshot stays stable. */
interface State {
  pending: Pending | null;
  queue: readonly Queued[];
}

const isQuestion = (request: Pending['request']): request is Question =>
  !('dialog' in request);

/**
 * How long there is to read.
 *
 * The reading tokens are the same in every theme and every mode, so they
 * are read once from the shipped defaults rather than through a hook:
 * this runs when `notify` is called, which may be nowhere near React.
 */
const READING = defaultComponentTokens(semanticLight).Snackbar.tokens.reading;

const timeToRead = (message: string) =>
  Math.min(
    READING.max,
    Math.max(READING.min, READING.base + message.length * READING.perCharacter),
  );

/**
 * Build the one dialog channel an application has.
 *
 * **One per application, and that is structural rather than
 * documented.** Two dialogs never coexist, so two channels would be two
 * things able to open one, and the rule would only hold as long as
 * everyone remembered it. An app writes this once and imports `ask` from
 * there:
 *
 * ```ts
 * // app/dialogs.ts
 * export const { DialogHost, ask, useDialog } = createDialogs({ pickAddress: PickAddress });
 * ```
 *
 * `ask` is a plain function, which is the point: a store or a service
 * asks a question without importing a component or a hook, and the flow
 * reads in order rather than scattering into callbacks.
 *
 * ```ts
 * if ((await ask({ title: 'Salvare?', actions: [...] })) === 'save') {
 *   await api.put(url, body);
 * }
 * ```
 */
export function createDialogs<R extends object = Record<string, never>>(
  registry?: R,
): DialogApi<R> {
  let state: State = { pending: null, queue: [] };
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (__DEV__ && listeners.size > 1) {
      console.warn(
        '[@dashforge/rn] More than one <DialogHost> is mounted from the same ' +
          'createDialogs(). Two dialogs are never meant to coexist, so the second host ' +
          'will mirror the first and both will show it.',
      );
    }
    return () => {
      listeners.delete(listener);
    };
  };

  const snapshot = () => state;

  const settle = (value: unknown) => {
    const held = state.pending;
    state = { ...state, pending: null };
    emit();
    held?.settle(value);
  };

  /** Take one off the front, having said what it had to say. */
  const dismiss = (entry: Queued, value: unknown) => {
    if (state.queue[0] !== entry) return;
    state = { ...state, queue: state.queue.slice(1) };
    emit();
    entry.settle(value);
  };

  const notify = (input: string | Notification<NotificationAction | undefined>) =>
    new Promise((resolve, reject) => {
      if (listeners.size === 0) {
        const message =
          '[@dashforge/rn] notify() was called with no <DialogHost> mounted, so there is ' +
          'nowhere to show it. Mount the host once at the root of the app.';
        if (__DEV__) console.warn(message);
        reject(new Error(message));
        return;
      }

      const notification =
        typeof input === 'string' ? { message: input } : input;

      // Queued and not refused, unlike a second `ask`. Two dialogs at
      // once is somebody's mistake; two things to say is two true
      // things, and dropping one drops information.
      const entry: Queued = {
        notification,
        duration: notification.duration ?? timeToRead(notification.message),
        settle: resolve,
      };
      state = { ...state, queue: [...state.queue, entry] };
      emit();
    });

  const ask = (request: Pending['request']) =>
    new Promise((resolve, reject) => {
      if (listeners.size === 0) {
        const message =
          '[@dashforge/rn] ask() was called with no <DialogHost> mounted, so there is ' +
          'nowhere to show the dialog. Mount the host once at the root of the app.';
        if (__DEV__) console.warn(message);
        reject(new Error(message));
        return;
      }

      if (state.pending !== null) {
        // Not queued on purpose. Two dialogs never coexist, so a second
        // ask is a defect in the caller: queueing would hide it and
        // reorder business logic nobody wrote that way, and resolving
        // `null` would read as "closed without answering" and skip the
        // action in silence.
        const message =
          '[@dashforge/rn] ask() was called while a dialog was already open. Two dialogs ' +
          'never coexist, so this is a defect in the caller rather than something to ' +
          'queue: await the first answer before asking again.';
        if (__DEV__) console.warn(message);
        reject(new Error(message));
        return;
      }

      state = { ...state, pending: { request, settle: resolve } };
      emit();
    });

  /**
   * The layer, mounted once at the root and empty until asked.
   *
   * Reads the pending request through `useSyncExternalStore`, so the
   * channel stays a plain object that code outside React can write to
   * and this is the only thing that re-renders when it does.
   */
  function DialogHost({
    children,
    bottomInset = 0,
  }: {
    children?: ReactNode;
    bottomInset?: number;
  }) {
    const { pending: current, queue } = useSyncExternalStore(
      subscribe,
      snapshot,
      snapshot,
    );

    // Held while a dialog is up. A notification raised then would be
    // *behind* it, since a modal is its own window, so the queue waits
    // and the thing gets said once there is somewhere to say it.
    const note = current === null ? (queue[0] ?? null) : null;

    useEffect(() => {
      if (note === null) return;
      const timer = setTimeout(() => dismiss(note, null), note.duration);
      return () => clearTimeout(timer);
    }, [note]);

    const close = useCallback(() => settle(null), []);

    return (
      <>
        {children}
        <Modal
          open={current !== null}
          onClose={close}
          dismissible={
            current !== null && isQuestion(current.request)
              ? (current.request.dismissible ?? true)
              : true
          }
          label={
            current !== null && isQuestion(current.request)
              ? current.request.title
              : undefined
          }
        >
          {current === null ? null : isQuestion(current.request) ? (
            <Answers question={current.request} />
          ) : (
            <Registered
              name={current.request.dialog}
              props={current.request.props}
              registry={registry}
            />
          )}
        </Modal>
        {note === null ? null : (
          <Snackbar
            // Keyed by identity, so a second notification arriving after
            // the first is a new strip that enters rather than the same
            // one whose words changed underneath the reader.
            key={note.duration + note.notification.message}
            message={note.notification.message}
            kind={note.notification.kind}
            actionLabel={note.notification.action?.label}
            onAction={
              note.notification.action
                ? () => dismiss(note, note.notification.action?.value)
                : undefined
            }
            offset={bottomInset}
          />
        )}
      </>
    );
  }

  /** A question: a heading, some words, and the answers it offers. */
  function Answers({ question }: { question: Question }) {
    const { kind = 'neutral', title, message, actions } = question;
    const last = actions.length - 1;

    return (
      <>
        <Modal.Header title={title} subtitle={message} />
        <Modal.Footer divider align={actions.length > 2 ? 'stack' : 'end'}>
          {actions.map((action: DialogAction, index) => (
            <Button
              key={action.value}
              size="sm"
              fullWidth={actions.length > 2}
              // The last one is the affirmative answer and reads as
              // such; the rest step back so there is one obvious thing
              // to do.
              variant={action.variant ?? (index === last ? 'solid' : 'ghost')}
              color={
                action.color ?? (index === last ? KIND_COLOR[kind] : 'secondary')
              }
              onPress={() => settle(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </Modal.Footer>
      </>
    );
  }

  /** One of the app's own dialogs, found by name. */
  function Registered({
    name,
    props,
    registry: map,
  }: {
    name: string;
    props?: object;
    registry?: R;
  }) {
    // Typed loosely here and precisely at the call site: the host cannot
    // know which of the registry's components it is about to render, so
    // the props it forwards are checked where `ask` was called and not
    // here.
    const Component = map?.[name as keyof R] as
      | ((p: { close: (value: unknown) => void } & Record<string, unknown>) => ReactNode)
      | undefined;

    if (Component === undefined) {
      if (__DEV__) {
        console.warn(
          `[@dashforge/rn] No dialog is registered under "${name}". Pass it to ` +
            'createDialogs() so the host knows what to show.',
        );
      }
      return (
        <Typography color="danger">
          {`Nessun dialogo registrato per "${name}".`}
        </Typography>
      );
    }

    // `close(value)` and not `close()`: a registered dialog that answers
    // nothing resolves `undefined`, which is an answer, where `null` is
    // the dialog having been closed without one.
    return (
      <Component
        {...(props as Record<string, unknown>)}
        close={(value: unknown) => settle(value)}
      />
    );
  }

  return {
    DialogHost,
    // The one cast in the file, and it is at the boundary: the overloads
    // in `Ask` are the contract callers see, while the implementation
    // takes the union of the two shapes. Narrowing it any other way
    // would mean writing the overloads twice.
    ask: ask as unknown as Ask<R>,
    useDialog: () => ask as unknown as Ask<R>,
    notify: notify as unknown as Notify,
  };
}
