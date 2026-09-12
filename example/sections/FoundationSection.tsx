import { useState } from 'react';
import {
  Avatar,
  Badge,
  Chip,
  Divider,
  Image,
  List,
  ListItem,
  Stack,
  Typography,
} from '@dashforge/rn';
import type { AvatarSize } from '@dashforge/rn';
import { Card, Caption, Row } from '../ui';
import { More, Search } from '../icons';

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const PEOPLE = [
  { name: 'Kenjy Saadi', role: 'Amministratore', unread: 3 },
  { name: 'Ada Byron King', role: 'Sviluppatrice', unread: 0 },
  { name: 'Grace Hopper', role: 'Ospite', unread: 142 },
];

const CITIES = ['Milano', 'Roma', 'Napoli', 'Torino'];

export function FoundationSection() {
  const [picked, setPicked] = useState<string[]>(['Milano']);
  const [removed, setRemoved] = useState<string[]>([]);

  const toggle = (city: string) =>
    setPicked(p => (p.includes(city) ? p.filter(c => c !== city) : [...p, city]));

  return (
    <>
      <Card>
        <Card.Header
          title="Divider"
          subtitle="Una linea, e l'aria che si tiene attorno"
        />
        <Caption>
          L'aria è il punto. Una linea senza margini è una linea che poi
          l'utente deve spaziare a mano a ogni chiamata, ed è lì che un design
          comincia a divergere. Non è la linea fra le righe di una lista: quella
          appartiene alla riga sopra e la disegna List.
        </Caption>
        <Typography>Sopra</Typography>
        <Divider />
        <Typography>Sotto</Typography>
        <Divider label="oppure" />
        <Typography>In fondo</Typography>
        <Divider spacing="sm" />
        <Stack direction="row" align="center">
          <Typography>Sinistra</Typography>
          <Divider orientation="vertical" spacing="md" />
          <Typography>Destra</Typography>
        </Stack>
      </Card>

      <Card>
        <Card.Header title="Avatar" subtitle="Cinque passi, non tre" />
        <Caption>
          Un controllo ha tre misure perché ha tre ruoli. Un avatar è la foto di
          una persona: compare come miniatura in una riga, come faccia in
          un'intestazione e come ritratto in un profilo, e quelle tre cose sono
          più lontane di quanto tre numeri riescano a coprire.
        </Caption>
        <Row gap="stack">
          {SIZES.map(s => (
            <Avatar key={s} name="Kenjy Saadi" size={s} />
          ))}
        </Row>
        <Divider spacing="sm" />
        <Caption>
          Foto, poi iniziali, poi icona. Scende la lista da solo, e la riscende
          quando una foto non si carica: il secondo avatar qui punta a un URL
          che non esiste.
        </Caption>
        <Row gap="stack">
          <Avatar
            source={{ uri: 'https://picsum.photos/id/1005/200' }}
            name="Kenjy Saadi"
            size="lg"
          />
          <Avatar
            source={{ uri: 'https://example.invalid/nope.png' }}
            name="Ada Byron King"
            size="lg"
          />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar icon={More} size="lg" />
          <Avatar icon={Search} size="lg" radius="md" />
        </Row>
      </Card>

      <Card>
        <Card.Header title="Badge" subtitle="Un conteggio, una parola, o un punto" />
        <Caption>
          Sta da solo e non si aggancia mai a qualcos'altro. Il badge che pende
          dall'angolo di un'icona è esattamente quello che React Native non può
          promettere: Android ritaglia un figlio ai bordi del padre, quindi lo
          stesso codice che su iOS sta bene su Android perde un angolo.
        </Caption>
        <Row gap="inline">
          <Badge count={3} />
          <Badge count={140} color="danger" />
          <Badge color="success">Attivo</Badge>
          <Badge color="warning">In pausa</Badge>
          <Badge color="secondary">Bozza</Badge>
        </Row>
        <Caption>soft</Caption>
        <Row gap="inline">
          <Badge count={3} variant="soft" />
          <Badge count={140} variant="soft" color="danger" />
          <Badge variant="soft" color="success">
            Attivo
          </Badge>
          <Badge variant="soft" color="warning">
            In pausa
          </Badge>
          <Badge variant="soft" color="secondary">
            Bozza
          </Badge>
        </Row>
        <Caption>Un punto dice che è cambiato qualcosa senza dire quanto.</Caption>
        <Row gap="inline">
          <Badge dot color="danger" />
          <Badge dot color="success" />
          <Badge dot color="secondary" />
        </Row>
      </Card>

      <Card>
        <Card.Header title="Chip" subtitle="Annunciato per quello che è davvero" />
        <Caption>
          Con uno stato scelto e un onPress è un interruttore, perché ha un
          acceso e uno spento e chi legge deve sentire quale. Con solo un
          onPress è un pulsante. Senza nessuno dei due è testo: niente in lui è
          premibile, e chiamarlo pulsante sarebbe una promessa che non mantiene.
        </Caption>
        <Row gap="inline">
          {CITIES.map(city => (
            <Chip
              key={city}
              label={city}
              selected={picked.includes(city)}
              onPress={() => toggle(city)}
            />
          ))}
        </Row>
        <Caption>
          {`Scelte: ${picked.length ? picked.join(', ') : 'nessuna'}`}
        </Caption>
        <Divider spacing="sm" />
        <Caption>
          La croce è un bersaglio suo con un nome suo, e quel nome porta la
          parola del chip: undici chip che annunciano "Rimuovi" undici volte
          sono un elenco inutilizzabile.
        </Caption>
        <Row gap="inline">
          {CITIES.filter(c => !removed.includes(c)).map(city => (
            <Chip
              key={city}
              label={city}
              color="secondary"
              onRemove={() => setRemoved(r => [...r, city])}
            />
          ))}
        </Row>
        <Divider spacing="sm" />
        <Row gap="inline">
          <Chip label="Bozza" color="warning" selected />
          <Chip label="Pubblicato" color="success" selected />
          <Chip label="Solo testo" />
          <Chip label="Spento" onPress={() => {}} disabled />
        </Row>
      </Card>

      <Card>
        <Card.Header title="Image" subtitle="Si comporta anche quando non arriva" />
        <Caption>
          La scatola tiene la forma qualunque cosa faccia la foto, così la
          pagina non salta quando atterra. La seconda qui sotto punta a un URL
          che non esiste: mostra un segno invece di un buco.
        </Caption>
        <Stack direction="row" gap="stack">
          <Stack sx={{ flex: 1 }}>
            <Image
              source={{ uri: 'https://picsum.photos/id/1015/400/300' }}
              aspectRatio={4 / 3}
              radius="md"
            />
          </Stack>
          <Stack sx={{ flex: 1 }}>
            <Image
              source={{ uri: 'https://example.invalid/nope.png' }}
              aspectRatio={4 / 3}
              radius="md"
            />
          </Stack>
        </Stack>
      </Card>

      <Card padding="none">
        <List divider="inset">
          {PEOPLE.map(p => (
            <ListItem
              key={p.name}
              leading={<Avatar name={p.name} size="sm" />}
              title={p.name}
              subtitle={p.role}
              trailing={
                p.unread > 0 ? (
                  <Badge
                    count={p.unread}
                    color="danger"
                    accessibilityLabel={`${p.unread} messaggi non letti`}
                  />
                ) : undefined
              }
            />
          ))}
        </List>
      </Card>

      <Card>
        <Caption>
          I tre insieme, che è il motivo per cui sono nati adesso: un avatar
          nello slot iniziale di una riga, un badge in quello finale, e le linee
          della lista che partono dal titolo perché lo slot iniziale ha la
          misura di un'icona.
        </Caption>
      </Card>
    </>
  );
}
