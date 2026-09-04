import { View } from 'react-native';
import { Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Card, Caption, Label } from '../ui';

const VARIANTS = [
  'display',
  'title',
  'subtitle',
  'body',
  'bodySmall',
  'label',
  'caption',
  'mono',
] as const;

const COLORS = ['primary', 'secondary', 'muted', 'disabled'] as const;
const ROLES = ['success', 'warning', 'danger', 'info'] as const;

export function TypographySection() {
  const s = useTheme().semantic;
  return (
    <>
      <Card>
        <Label>Scala</Label>
        {VARIANTS.map(v => (
          <View key={v} style={{ gap: 2 }}>
            <Caption>
              {`${v}  ${s.typography[v].fontSize} / ${s.typography[v].lineHeight} / ${s.typography[v].fontWeight}`}
            </Caption>
            <Typography variant={v}>Ordini recenti</Typography>
          </View>
        ))}
      </Card>

      <Card>
        <Label>Colori di testo</Label>
        {COLORS.map(c => (
          <Typography key={c} color={c}>
            {c}
          </Typography>
        ))}
      </Card>

      <Card>
        <Label>Ruoli di feedback</Label>
        {ROLES.map(c => (
          <Typography key={c} color={c}>
            {c}
          </Typography>
        ))}
      </Card>

      <Card>
        <Label>Troncamento</Label>
        <Caption>
          numberOfLines, che su 402 punti è la norma e non l'eccezione.
        </Caption>
        <Typography numberOfLines={1}>
          Un nome cliente molto lungo che non entrerà mai nella riga di una
          lista su un telefono, per quanto stretta sia la colonna.
        </Typography>
      </Card>
    </>
  );
}
