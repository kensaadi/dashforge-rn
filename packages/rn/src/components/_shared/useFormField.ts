import { useContext, useEffect, useRef } from 'react';
import { DashFormContext } from '@dashforge/ui-core';
import type { DashFormBridge, FieldRegistration } from '@dashforge/ui-core';
import { useDashFieldMeta } from '@dashforge/forms';

/**
 * Everything a field needs from the form, and nothing about text.
 *
 * Extracted so `NumberField` does not carry a second copy of it. The
 * copy would have been the dangerous kind: the StrictMode-safe
 * unregister below is the sort of thing that is right once and then
 * drifts, and a field that unregisters itself on a remount fails
 * silently and only in development.
 *
 * **Through the bridge, never through react-hook-form.** RHF is a
 * dependency of `@dashforge/forms` alone, which wraps it and publishes a
 * neutral bridge on `DashFormContext`. No renderer imports RHF, and none
 * of them uses `Controller`.
 *
 * @internal
 */
export function useFormField(name: string | undefined, rules: unknown) {
  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  const isFormMode = Boolean(name && bridge?.register);

  // A no-op without a bridge, so the standalone case costs nothing
  // rather than needing a branch at the call site.
  const fieldMeta = useDashFieldMeta(name ?? '');

  // StrictMode-safe unregister. The double invoke in development mounts,
  // unmounts and mounts again, so an eager unregister on the first
  // teardown would drop a field that is about to be alive. Deferring to
  // a microtask lets the remount win.
  const unregisterRef = useRef({ bridge, name });
  unregisterRef.current = { bridge, name };
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const { bridge: b, name: n } = unregisterRef.current;
      if (!n) return;
      // `Promise.resolve().then` rather than `queueMicrotask`: same
      // timing, and it needs no ambient global that the DOM-free lib
      // config does not have.
      void Promise.resolve().then(() => {
        if (!mountedRef.current) b?.unregister?.(n);
      });
    };
  }, []);

  return {
    bridge,
    isFormMode,
    fieldMeta,
    /**
     * Registers with the engine. Called from the render body **after**
     * the visibility and access checks, so a field that is not on the
     * screen is not in the payload either.
     */
    register: (): FieldRegistration | null =>
      isFormMode && bridge && name ? bridge.register(name, rules) : null,
    /**
     * Writes through. The value is whatever the field's own type is:
     * a string from `TextField`, a number from `NumberField`, which is
     * the whole reason the two are different components.
     */
    commit: (registration: FieldRegistration | null, next: unknown) => {
      if (!isFormMode || !bridge || !name) return;
      bridge.setValue?.(name, next);
      void registration?.onChange?.({ target: { name, value: next } });
    },
  };
}
