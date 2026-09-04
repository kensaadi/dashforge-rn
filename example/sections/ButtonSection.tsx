import { View } from 'react-native';
import { Button } from '@dashforge/rn';
import { Card, Caption, Label, Row } from '../ui';

const COLORS = [
  'primary',
  'secondary',
  'danger',
  'success',
  'warning',
] as const;
const VARIANTS = ['solid', 'outline', 'ghost', 'link'] as const;

export function ButtonSection() {
  return (
    <>
      <Card>
        <Label>Varianti e ruoli</Label>
        {VARIANTS.map(variant => (
          <View key={variant} style={{ gap: 6 }}>
            <Caption>{variant}</Caption>
            <Row>
              {COLORS.map(color => (
                <Button key={color} variant={variant} color={color} size="sm">
                  {color}
                </Button>
              ))}
            </Row>
          </View>
        ))}
      </Card>

      <Card>
        <Label>Misure</Label>
        <Caption>
          36 / 44 / 52. La piccola recupera i 44pt minimi con hitSlop.
        </Caption>
        <Row>
          <Button size="sm">Piccolo</Button>
          <Button size="md">Medio</Button>
          <Button size="lg">Grande</Button>
        </Row>
      </Card>

      <Card>
        <Label>Stati</Label>
        <Caption>
          Caricamento tiene il colore pieno. Disabilitato no. Non si confondono.
        </Caption>
        <Row>
          <Button>Riposo</Button>
          <Button loading>Caricamento</Button>
          <Button disabled>Disabilitato</Button>
        </Row>
      </Card>

      <Card>
        <Label>A tutta larghezza</Label>
        <Button fullWidth size="lg">
          Conferma ordine
        </Button>
        <Button fullWidth variant="outline" color="secondary">
          Annulla
        </Button>
      </Card>
    </>
  );
}
