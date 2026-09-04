import type { DashFormBridge } from '@dashforge/ui-core';

export interface ValidationState {
  invalid: boolean;
  helperText: string | undefined;
}

/**
 * Work out whether a bridge-managed field should show an error, and what
 * text goes under it.
 *
 * Renderer-agnostic logic, copied rather than shared for the same reason
 * `useAccessState` is: the renderers share the engine, not their
 * internals. Copied **behaviour-identical** to the other two, because a
 * form that validates differently per renderer is a bug in whichever one
 * you are not looking at.
 *
 * Three rules, in order:
 *
 * 1. **An explicit prop wins.** If the caller passed `error` or
 *    `helperText`, that is the answer.
 * 2. **The bridge's error is gated by interaction.** It surfaces only
 *    once the field has been touched or the form has been submitted at
 *    least once. Without that gate every field in an empty form turns
 *    red before the user has typed anything, which trains people to
 *    ignore the colour.
 * 3. **`error={false}` clears the message too**, not just the styling,
 *    so forcing a valid state does not leave orphaned red text.
 */
export function resolveValidationState(
  name: string,
  bridge: DashFormBridge,
  explicitError: boolean | undefined,
  explicitHelperText: string | undefined,
): ValidationState {
  const autoError = bridge.getError(name) ?? null;
  const touched = bridge.isTouched(name) ?? false;
  const submitCount = bridge.submitCount ?? 0;
  const allowAuto = touched || submitCount > 0;

  return {
    invalid: explicitError ?? (Boolean(autoError) && allowAuto),
    helperText: explicitHelperText ?? (allowAuto ? autoError?.message : undefined),
  };
}
