import type { AccessRequirement } from '@dashforge/rbac';
import type { VisibleWhen } from '../../hooks/useVisibility';

/**
 * The two props every Dashforge component carries.
 *
 * They are the reason this is a Dashforge library rather than another
 * React Native component kit: permissions and form-driven visibility are
 * declared at the call site, on the component, instead of being wrapped
 * around it. Ten `{can('x') && <Button/>}` guards in a screen is ten
 * places to get it wrong.
 *
 * Both are optional and both cost nothing when absent: no provider, no
 * form, no behaviour change.
 */
export interface DashforgeProps {
  /**
   * Permission requirement, resolved against the ambient `<RbacProvider>`.
   *
   * `onUnauthorized` decides what denial looks like, and the component
   * consumes that decision rather than overriding it: `'hide'` (the
   * default) removes it, `'disable'` renders it inert, `'readonly'`
   * renders it non-editable.
   *
   * With no provider mounted, access is granted and a warning is logged
   * in development. Failing open is the safer default: a silent deny is
   * a regression found late, an over-permissive dev build is found
   * immediately.
   *
   * @default undefined
   *
   * @example
   * ```tsx
   * <Button access={{ resource: 'invoice', action: 'delete' }}>Elimina</Button>
   * <Button access={{ resource: 'plan', action: 'edit', onUnauthorized: 'disable' }}>
   *   Cambia piano
   * </Button>
   * ```
   */
  access?: AccessRequirement;
  /**
   * Render only while this predicate holds, evaluated against the
   * ambient `<DashForm>` engine and re-evaluated as form state changes.
   *
   * Outside a form there is no engine and the predicate is never called,
   * so the component simply renders.
   *
   * @default undefined
   *
   * @example
   * ```tsx
   * <TextField name="vat" visibleWhen={(e) => e.getValue('type') === 'business'} />
   * ```
   */
  visibleWhen?: VisibleWhen;
}
