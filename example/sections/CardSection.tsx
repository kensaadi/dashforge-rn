import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Typography } from '@dashforge/rn';
import { Caption, Label, Row } from '../ui';

/**
 * The component the playground had to invent twice before it existed:
 * once as `Card` in `ui.tsx`, once as `Panel` inside the Surface
 * section. Both are now this.
 */
export function CardSection() {
  const [tapped, setTapped] = useState(0);

  return (
    <>
      <Card>
        <Card.Header
          title="Varianti"
          subtitle="Un bordo, un'ombra, o un fondo diverso. Mai due insieme."
        />
        <Card variant="outlined">
          <Label>outlined</Label>
          <Caption>
            Il default. Un bordo si legge su qualsiasi fondo e non compete con
            il contenuto.
          </Caption>
        </Card>
        <Card variant="elevated">
          <Label>elevated</Label>
          <Caption>
            L'eccezione, per una scheda che deve stare sopra la pagina. In
            scuro l'ombra si legge poco, per questo lì porta più opacità.
          </Caption>
        </Card>
        <Card variant="filled">
          <Label>filled</Label>
          <Caption>
            Sta dentro la pagina invece che sopra: un raggruppamento, non un
            oggetto separato.
          </Caption>
        </Card>
      </Card>

      <Card>
        <Card.Header
          title="Testata"
          subtitle="Titolo, sottotitolo e un'azione in coda"
          action={
            <Button size="sm" variant="ghost" onPress={() => setTapped(0)}>
              Azzera
            </Button>
          }
        />
        <Caption>
          L'azione resta in alto invece che centrarsi, così non scivola quando
          il titolo va a capo. Prova a girare il telefono.
        </Caption>
        <Card variant="filled">
          <Card.Header
            title="Un titolo abbastanza lungo da andare a capo su due righe"
            subtitle="Il blocco di testo prende la larghezza, l'azione no"
            action={<Button size="sm" color="secondary">Apri</Button>}
          />
        </Card>
      </Card>

      <Card>
        <Card.Header title="Spaziatura" subtitle="none, sm, md, lg" />
        <Row>
          {(['none', 'sm', 'md', 'lg'] as const).map(p => (
            <Card key={p} variant="filled" padding={p}>
              <Typography variant="caption">{p}</Typography>
            </Card>
          ))}
        </Row>
        <Caption>
          `none` serve alla scheda il cui contenuto arriva ai bordi: un'immagine
          a tutta larghezza, o una lista che disegna le sue righe.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Premibile"
          subtitle="Tutta la scheda diventa un bersaglio solo"
        />
        <Card
          variant="elevated"
          onPress={() => setTapped(n => n + 1)}
          accessibilityLabel="Apri la fattura 2024-118"
        >
          <Card.Header title="Fattura 2024-118" subtitle="Scade il 12 marzo" />
          <Typography color="muted" variant="caption">
            Toccata {tapped} volte
          </Typography>
        </Card>
        <Card variant="outlined" onPress={() => {}} disabled>
          <Card.Header title="Non disponibile" subtitle="Inerte e attenuata" />
        </Card>
        <Caption>
          Con onPress diventa un bottone anche per chi usa VoiceOver, quindi
          vuole una etichetta se il contenuto non dice già dove porta.
        </Caption>
      </Card>

      <Card variant="filled">
        <Card.Header
          title="Ombra e ritaglio"
          subtitle="L'unica trappola vera di elevated"
        />
        <Caption>
          L'ombra è disegnata fuori dai limiti della vista. Un antenato con
          overflow hidden la toglie su iOS, mentre Android continua a
          disegnarla perché elevation è una proprietà della vista e non un
          bordo dipinto. Per arrotondare un'immagine dentro una scheda
          elevata: ritaglia l'immagine, non la scheda.
        </Caption>
        <View />
      </Card>
    </>
  );
}
