import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Typography } from '../Typography/Typography';
import { Modal } from './Modal';
import type {
  Ask,
  DialogAction,
  DialogApi,
  DialogKind,
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

const isQuestion = (request: Pending['request']): request is Question =>
  !('dialog' in request);

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
  let pending: Pending | null = null;
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

  const snapshot = () => pending;

  const settle = (value: unknown) => {
    const held = pending;
    pending = null;
    emit();
    held?.settle(value);
  };

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

      if (pending !== null) {
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

      pending = { request, settle: resolve };
      emit();
    });

  /**
   * The layer, mounted once at the root and empty until asked.
   *
   * Reads the pending request through `useSyncExternalStore`, so the
   * channel stays a plain object that code outside React can write to
   * and this is the only thing that re-renders when it does.
   */
  function DialogHost({ children }: { children?: ReactNode }) {
    const current = useSyncExternalStore(subscribe, snapshot, snapshot);

    const dismiss = useCallback(() => settle(null), []);

    return (
      <>
        {children}
        <Modal
          open={current !== null}
          onClose={dismiss}
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
  };
}
