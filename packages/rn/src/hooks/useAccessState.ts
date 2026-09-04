import { useMemo } from 'react';
import { resolveAccessState, useRbacOptional } from '@dashforge/rbac';
import type { AccessRequirement, AccessState } from '@dashforge/rbac';

/**
 * Full access. Returned when no requirement is given, and when one is
 * given but no `RbacProvider` is mounted.
 *
 * @internal
 */
const FULL_ACCESS: AccessState = {
  visible: true,
  disabled: false,
  readonly: false,
  granted: true,
};

/**
 * Resolve an RBAC requirement into what a component should do about it.
 *
 * **A third copy, deliberately.** `@dashforge/ui` and `@dashforge/tw`
 * each hold their own, and their doc comments say so. The renderers
 * share the engine, not their hooks; hoisting this into a common package
 * would couple three release lines together to save nine lines of code.
 *
 * Behaviour is identical across all three, and the part worth stating is
 * that it **fails open**: a missing provider grants access and warns in
 * development. RBAC silently denying everything is a hidden regression a
 * developer discovers late, while an over-permissive dev build is
 * visible immediately and never reaches a user, because a production app
 * that means to enforce permissions mounts the provider.
 *
 * @example
 * ```tsx
 * const access = useAccessState({ resource: 'invoice', action: 'delete' });
 * if (!access.visible) return null;
 * ```
 */
export function useAccessState(access: AccessRequirement | undefined): AccessState {
  // Called unconditionally: `useRbacOptional` returns null rather than
  // throwing when no provider is mounted, which is what makes the
  // standalone case work without a branch on the hook itself.
  const rbac = useRbacOptional();

  return useMemo(() => {
    if (!access) return FULL_ACCESS;

    if (!rbac) {
      if (__DEV__) {
        console.warn(
          '[@dashforge/rn] An `access` requirement was given but no <RbacProvider> is ' +
            'mounted, so it was ignored and access granted. Wrap the tree in a provider ' +
            `to enforce it. Resource: ${access.resource}, action: ${access.action}`,
        );
      }
      return FULL_ACCESS;
    }

    return resolveAccessState(access, (request) =>
      rbac.engine.can(rbac.subject, request),
    );
  }, [access, rbac]);
}
