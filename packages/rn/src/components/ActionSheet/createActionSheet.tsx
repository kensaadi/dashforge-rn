import { useSyncExternalStore } from 'react';
import { ActionSheetIOS, Platform, Text, View } from 'react-native';
import { resolveTypeStyle } from '../../theme/typography';
import { useComponentTokens } from '../../theme/useComponentTokens';
import { BottomSheet } from '../BottomSheet/BottomSheet';
import { Button } from '../Button/Button';
import type { ActionSheetApi, SheetRequest } from './actionSheet.types';

interface Pending {
  request: SheetRequest;
  settle: (key: string | null) => void;
}

/**
 * One channel per application, for the sheet of choices.
 *
 * **iOS gets the platform's own sheet and Android gets ours.** That is
 * bucket three in ARCHITECTURE.md applied literally: action sheets are
 * named there as a system surface, to be delegated and never
 * reimplemented, because a drawn copy is uncanny-valley work that also
 * breaks when the OS changes. Android has no equivalent surface to
 * delegate to, so there the sheet is drawn on `BottomSheet`.
 *
 * The call is the same on both, which is the point. What differs is
 * what answers it.
 *
 * **Cancelling is an answer and not an error.** It resolves with `null`
 * rather than rejecting, for the same reason `ask()` does: somebody
 * changing their mind is the system working.
 *
 * @example
 * ```tsx
 * // once, near the root
 * export const { ActionSheetHost, showActionSheet } = createActionSheet();
 *
 * const picked = await showActionSheet({
 *   title: 'La foto',
 *   options: [
 *     { key: 'camera', label: 'Scatta una foto' },
 *     { key: 'library', label: 'Scegli dalla galleria' },
 *     { key: 'remove', label: 'Rimuovi', destructive: true },
 *   ],
 * });
 * ```
 */
export function createActionSheet(): ActionSheetApi {
  let pending: Pending | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (__DEV__ && listeners.size > 1) {
      console.warn(
        '[@dashforge/rn] More than one <ActionSheetHost> is mounted from the same ' +
          'createActionSheet(). Two sheets are never meant to coexist, so the second host ' +
          'will mirror the first and both will show it.',
      );
    }
    return () => {
      listeners.delete(listener);
    };
  };

  const read = () => pending;

  const settle = (key: string | null) => {
    const current = pending;
    pending = null;
    emit();
    current?.settle(key);
  };

  const showActionSheet = (request: SheetRequest) =>
    new Promise<string | null>((resolve) => {
      if (Platform.OS === 'ios') {
        // The platform's own, which is what somebody recognises as
        // belonging to their phone. No host is involved.
        const cancel = request.cancelLabel ?? 'Annulla';
        const labels = [...request.options.map((o) => o.label), cancel];
        const destructive = request.options
          .map((o, i) => (o.destructive ? i : -1))
          .filter((i) => i >= 0);
        const off = request.options
          .map((o, i) => (o.disabled ? i : -1))
          .filter((i) => i >= 0);

        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: request.title,
            message: request.message,
            options: labels,
            cancelButtonIndex: labels.length - 1,
            destructiveButtonIndex: destructive.length ? destructive : undefined,
            disabledButtonIndices: off.length ? off : undefined,
          },
          (index) => {
            const picked = request.options[index];
            resolve(picked ? picked.key : null);
          },
        );
        return;
      }

      if (listeners.size === 0) {
        if (__DEV__) {
          console.warn(
            '[@dashforge/rn] showActionSheet() was called with no <ActionSheetHost> mounted, ' +
              'so there is nowhere to draw it. Mount one near the root, beside <DialogHost>.',
          );
        }
        resolve(null);
        return;
      }

      // A second sheet while one is up would be two questions on screen
      // with one answer between them. The first one wins and the second
      // is told nothing was picked.
      if (pending) {
        resolve(null);
        return;
      }

      pending = { request, settle: resolve };
      emit();
    });

  function ActionSheetHost({ bottomInset = 0 }: { bottomInset?: number }) {
    const tokens = useComponentTokens('ActionSheet');
    const current = useSyncExternalStore(subscribe, read, read);

    // On iOS the platform answered and there is nothing to draw. The
    // host is still mounted so the same call works on both.
    if (Platform.OS === 'ios') return null;

    const request = current?.request;

    return (
      <BottomSheet
        open={Boolean(request)}
        onClose={() => settle(null)}
        label={request?.title}
        bottomInset={bottomInset}
        radius="lg"
      >
        {request?.title || request?.message ? (
          <View style={{ padding: tokens.headerPadding, gap: 4 }}>
            {request.title ? (
              <Text style={{ ...resolveTypeStyle(tokens.typography.title), color: tokens.color.title }}>
                {request.title}
              </Text>
            ) : null}
            {request.message ? (
              <Text style={{ ...resolveTypeStyle(tokens.typography.message), color: tokens.color.message }}>
                {request.message}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: tokens.gap }}>
          {(request?.options ?? []).map((option) => (
            <Button
              key={option.key}
              variant="ghost"
              color={option.destructive ? 'danger' : 'secondary'}
              disabled={option.disabled}
              fullWidth
              onPress={() => settle(option.key)}
            >
              {option.label}
            </Button>
          ))}
          <Button variant="outline" color="secondary" fullWidth onPress={() => settle(null)}>
            {request?.cancelLabel ?? 'Annulla'}
          </Button>
        </View>
      </BottomSheet>
    );
  }

  return { ActionSheetHost, showActionSheet };
}
