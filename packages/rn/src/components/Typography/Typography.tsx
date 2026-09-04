import { Text } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import { typographyRecipe } from './typography.variants';
import type { TypographyProps, TypographyVariant } from './typography.types';

/** Headings announce themselves as headings, without the caller asking. */
const HEADINGS: ReadonlySet<TypographyVariant> = new Set([
  'display',
  'title',
  'subtitle',
]);

/**
 * Text.
 *
 * `variant` brings size, weight, line height and tracking as a set;
 * `color` names a role rather than a value. Neither is overridable
 * piecemeal by prop: a size 19 or a colour `#333` goes through `sx` and
 * you know you have stepped outside the scale.
 *
 * Two things it does without being asked, because forgetting either is
 * the norm and both are invisible until somebody is affected:
 *
 * - a title-shaped variant gets `accessibilityRole="header"`, so
 *   heading navigation works in VoiceOver and TalkBack
 * - the variant's `maxFontSizeMultiplier` is applied, so reading text
 *   scales freely and control labels stay inside their controls
 *
 * @example
 * ```tsx
 * <Typography variant="title">Ordini recenti</Typography>
 * <Typography color="muted" numberOfLines={1}>{customer.email}</Typography>
 * <Typography access={{ resource: 'salary', action: 'read' }}>{amount}</Typography>
 * ```
 */
export function Typography(props: TypographyProps) {
  const theme = useTheme();
  const {
    children,
    variant = 'body',
    color = 'primary',
    align = 'left',
    weight,
    access,
    visibleWhen,
    sx,
    ...rest
  } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  const resolve = typographyRecipe(theme.semantic);
  // `disabled` is not a variant here but a colour: text has no inert
  // state to be in, it is either readable or it is the muted version of
  // itself. RBAC's `'disable'` and `'readonly'` therefore both land on
  // the disabled colour rather than on a separate treatment.
  const effectiveColor =
    accessState.disabled || accessState.readonly ? 'disabled' : color;
  const style = resolve({ variant, color: effectiveColor, align, weight });

  return (
    <Text
      accessibilityRole={HEADINGS.has(variant) ? 'header' : undefined}
      maxFontSizeMultiplier={theme.semantic.typography[variant].maxFontSizeMultiplier}
      {...rest}
      style={[style, sx]}
    >
      {children}
    </Text>
  );
}
