import { useEffect, useRef } from 'react';

/**
 * Warn once when a field is wired to nothing.
 *
 * The failure this catches is silent. With no bridge above it *and* no
 * `value` / `onChangeText` pair of its own, a field mounts as an
 * uncontrolled input that never reports a change to anybody. Nothing
 * throws, nothing looks wrong, and the developer is left wondering why
 * typing does not do anything.
 *
 * **A third copy, deliberately**, like `useAccessState`. `@dashforge/tw`
 * holds the original; `@dashforge/ui` has never had one. The renderers
 * share the form bridge, not their hooks.
 *
 * The React Native version tests `onChangeText` rather than `onChange`,
 * which is the pair a native field is actually controlled by.
 *
 * Fires once per mount, guarded by a ref so StrictMode's double invoke
 * does not double the warning, and only under `__DEV__`. The arguments
 * are read on the first render only: a field that becomes controlled
 * later was still broken at mount, so warning once is the whole job.
 *
 * @param componentName Named in the message, e.g. `'TextField'`.
 * @param name The field's `name`, included when set so the message points
 *   at a specific field.
 * @param isFormMode True when a bridge is present and registers the
 *   field. Suppresses the warning.
 * @param value The caller's value prop.
 * @param onChange The caller's change callback, `onChangeText` on a
 *   text field.
 */
export function useStandaloneFieldWarning(
  componentName: string,
  name: string | undefined,
  isFormMode: boolean,
  value: unknown,
  onChange: unknown,
): void {
  const warned = useRef(false);

  useEffect(() => {
    if (!__DEV__) return;
    if (warned.current) return;
    if (isFormMode) return;
    if (value !== undefined) return;
    if (onChange !== undefined) return;

    warned.current = true;
    const field =
      typeof name === 'string' && name.length > 0 ? ` name="${name}"` : '';
    console.warn(
      `[@dashforge/rn] <${componentName}${field}> is outside a <DashForm> and ` +
        'has no value/onChangeText of its own, so it will render but never ' +
        'report a change. Add the provider, or control it from the call site.',
    );
    // Mount only: the arguments are the situation at mount, and that is
    // the situation being judged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
