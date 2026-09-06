import { useContext } from 'react';
import { DashFormContext, useEngineVisibility } from '@dashforge/ui-core';
import type { DashFormBridge, Engine } from '@dashforge/ui-core';

/**
 * A predicate deciding whether to render.
 *
 * The engine is **nullable, and that is not defensive typing**: outside a
 * `<DashFormProvider>` there is no engine and the core calls the
 * predicate with
 * `null`. A predicate that reaches into it unconditionally throws there,
 * and the core swallows the throw and renders the component anyway, so
 * the failure is a component that will not hide rather than a crash.
 *
 * Typing it honestly moves that from a runtime surprise to a compile
 * error, and costs nothing for the common shape, which ignores the
 * argument entirely:
 *
 * ```tsx
 * // plain state, no form involved
 * <TextField visibleWhen={() => isBusiness} />
 *
 * // form state, and the standalone case has to be answered
 * <TextField visibleWhen={(e) => e?.getValue('type') === 'business'} />
 * ```
 */
export type VisibleWhen = (engine: Engine | null) => boolean;

/**
 * Resolve a `visibleWhen` predicate against the ambient form.
 *
 * Inside a form the predicate re-evaluates whenever engine state
 * changes, so a control can appear and disappear as another field is
 * filled in. Outside one there is no engine and the predicate is not
 * called at all, which is why a component using this works standalone
 * without the caller doing anything about it.
 *
 * @example
 * ```tsx
 * <Button visibleWhen={(e) => e?.getValue('plan') === 'pro'}>Upgrade</Button>
 * ```
 */
export function useVisibility(visibleWhen?: VisibleWhen): boolean {
  const bridge = useContext(DashFormContext) as DashFormBridge | null;
  return useEngineVisibility(bridge?.engine, visibleWhen);
}
