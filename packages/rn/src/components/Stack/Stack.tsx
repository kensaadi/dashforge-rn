import { Children, Fragment, isValidElement } from 'react';
import { View } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { stackRecipe } from './stack.variants';
import type { StackGap, StackProps } from './stack.types';

const NAMED_GAPS = ['none', 'inline', 'stack', 'inset', 'section'] as const;

function isNamedGap(gap: StackGap): gap is (typeof NAMED_GAPS)[number] {
  return typeof gap === 'string';
}

/**
 * A row or a column, with the space between its children named.
 *
 * The thin thing everyone writes: this playground had built its own
 * before the component existed, which is the same evidence that argued
 * for `Card`. What it adds over a `View` with a `flexDirection` is that
 * the gap comes from the spacing scale by name, the divider knows which
 * separator token to use, and the direction reads at the call site.
 *
 * **The cross-axis default depends on the direction, deliberately.** A
 * column stretches, which is React Native's own behaviour and what makes
 * a stack of cards fill the width. A row centres, because stretching
 * would make every child as tall as the tallest, and a button beside a
 * paragraph would then be paragraph-height. Two different defaults
 * because the wrong one is annoying in a different way each time.
 *
 * @example
 * ```tsx
 * <Stack gap="inline" direction="row">
 *   <Button>Annulla</Button>
 *   <Button>Conferma</Button>
 * </Stack>
 *
 * <Stack gap="none" divider>
 *   {rows.map((r) => <SettingRow key={r.id} {...r} />)}
 * </Stack>
 * ```
 */
export function Stack(props: StackProps) {
  const themeDefaults = useComponentDefaults('Stack');
  const tokens = useComponentTokens('Stack');

  const {
    children,
    direction = 'column',
    gap = 'stack',
    align,
    justify = 'start',
    wrap = false,
    divider = false,
    access,
    visibleWhen,
    sx,
    ...rest
  } = { ...themeDefaults, ...props } as StackProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const resolved = stackRecipe(tokens)({
    direction,
    gap: isNamedGap(gap) ? gap : undefined,
    // A row centres and a column stretches, for the reason in the doc
    // comment above.
    align: align ?? (direction === 'row' ? 'center' : 'stretch'),
    justify,
    wrap,
  });

  const style = [
    resolved,
    // A number is the escape hatch, and overrides the named gap the
    // recipe already applied.
    isNamedGap(gap) ? null : { gap },
    sx,
  ];

  if (!divider) {
    return (
      <View {...rest} style={style}>
        {children}
      </View>
    );
  }

  // Interleaved rather than drawn by the container, because a line
  // between children is not a property of the box: only the children
  // know where the boundaries are.
  const items = Children.toArray(children).filter((child) => child !== null);
  const rule =
    divider === true ? (
      <View
        // Along the stack's direction it is a line, across it it stretches
        // to whatever the stack is wide or tall.
        style={
          direction === 'row'
            ? { width: tokens.dividerWidth, alignSelf: 'stretch', backgroundColor: tokens.divider }
            : { height: tokens.dividerWidth, backgroundColor: tokens.divider }
        }
      />
    ) : (
      divider
    );

  return (
    <View {...rest} style={style}>
      {items.map((child, index) => (
        <Fragment key={isValidElement(child) && child.key ? child.key : index}>
          {index > 0 ? rule : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}
