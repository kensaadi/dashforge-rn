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
        <Card.Header
          title="Il raggio"
          subtitle="Un passo con un nome, non un numero"
        />
        <Caption>
          none, sm, md, lg, xl, 2xl, full. Gli stessi valori dei ruoli
          semantici: control è md, surface è lg, pill è full, e i ruoli sono
          alias dentro la scala invece che numeri paralleli, così non possono
          divergere. I nomi sono quelli di Tailwind perché il preset del web
          deve emettere chiavi che le utility conoscono: rounded-2xl esiste,
          rounded-xxl no.
        </Caption>
        <Row>
          {(['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map(r => (
            <Button
              key={r}
              size="sm"
              color="secondary"
              variant="outline"
              radius={r}
            >
              {r}
            </Button>
          ))}
        </Row>
        <Caption>
          Un valore arbitrario passa ancora da sx, ed è la riga che questa
          libreria traccia ovunque: un passo con un nome è il design system, un
          numero sei tu che ne esci. E se un'app vuole i bottoni squadrati
          dappertutto cambia theme.components.Button.tokens.radius una volta
          sola, non a ogni chiamata.
        </Caption>
      </Card>

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
