import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  List,
  ListItem,
  Skeleton,
  Stack,
  Tabs,
  Typography,
} from '@dashforge/rn';
import type { TabValue } from '@dashforge/rn';
import { Card, Caption } from '../ui';
import { Search, Plus, Trash } from '../icons';

const INBOX = [
  { name: 'Kenjy Saadi', subject: 'Il preventivo di marzo', unread: true },
  { name: 'Ada Byron King', subject: 'Note sulla macchina analitica', unread: true },
  { name: 'Grace Hopper', subject: 'Trovato un baco', unread: false },
  { name: 'Alan Turing', subject: 'Domanda sulla macchina', unread: false },
];

const REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Lazio',
  'Liguria',
  'Lombardia',
];

export function TabsSection() {
  const [box, setBox] = useState<TabValue>('all');
  const [region, setRegion] = useState<TabValue>('Abruzzo');

  const unread = INBOX.filter(m => m.unread);

  return (
    <>
      <Card>
        <Card.Header
          title="Non è navigazione"
          subtitle="Cambia cosa mostra una schermata, non schermata"
        />
        <Caption>
          ARCHITECTURE.md è esplicito: la navigazione è di react-navigation e
          questa libreria non reimplementa un router. La barra in fondo a
          un'app è TabBar, un altro componente che disegna e non naviga. Questa
          è la striscia dentro una schermata: tutti, non letti, archiviati.
        </Caption>
        <Caption>
          E non è nemmeno un campo di una form, che è quello che la separa da
          RadioGroup anche se entrambe sono una risposta fra tante. Una scelta
          in un RadioGroup finisce nel payload; un tab è una vista di qualcosa,
          e al motore delle form non interessa quale sia aperta.
        </Caption>
      </Card>

      <Card padding="none">
        <Stack sx={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Tabs value={box} onValueChange={setBox}>
            <Tabs.List accessibilityLabel="Filtra la posta">
              <Tabs.Tab value="all" label="Tutti" />
              <Tabs.Tab
                value="unread"
                label="Non letti"
                badge={<Badge count={unread.length} color="danger" variant="soft" />}
              />
              <Tabs.Tab value="trash" label="Cestino" />
            </Tabs.List>

            <Tabs.Panel value="all">
              <List divider="inset">
                {INBOX.map(m => (
                  <ListItem
                    key={m.name}
                    leading={<Avatar name={m.name} size="sm" />}
                    title={m.name}
                    subtitle={m.subject}
                  />
                ))}
              </List>
            </Tabs.Panel>

            <Tabs.Panel value="unread">
              <List divider="inset">
                {unread.map(m => (
                  <ListItem
                    key={m.name}
                    leading={<Avatar name={m.name} size="sm" />}
                    title={m.name}
                    subtitle={m.subject}
                  />
                ))}
              </List>
            </Tabs.Panel>

            <Tabs.Panel value="trash">
              <EmptyState
                icon={Trash}
                title="Il cestino è vuoto"
                description="Quello che elimini resta qui trenta giorni."
              />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>

      <Card>
        <Card.Header
          title="Quando sono tanti"
          subtitle="variant=&quot;scrollable&quot;"
        />
        <Caption>
          fitted divide la larghezza in parti uguali, che è quello che vogliono
          due o tre parole corte. scrollable dà a ognuno la larghezza della sua
          etichetta e scorre, che è quello che vogliono in otto. Quello
          selezionato viene portato in vista se lo scegli da qualche altra
          parte.
        </Caption>
        <Button
          size="sm"
          variant="outline"
          color="secondary"
          onPress={() => setRegion('Lombardia')}
        >
          Vai su Lombardia
        </Button>
      </Card>

      <Card padding="none">
        <Tabs value={region} onValueChange={setRegion}>
          <Tabs.List variant="scrollable" accessibilityLabel="Regione">
            {REGIONS.map(r => (
              <Tabs.Tab key={r} value={r} label={r} />
            ))}
          </Tabs.List>
          <Tabs.Panel value={region} sx={{ padding: 16 }}>
            <Typography>{`Hai scelto: ${region}`}</Typography>
          </Tabs.Panel>
        </Tabs>
      </Card>

      <Card>
        <Card.Header title="Con icone, e uno spento" />
        <Tabs defaultValue="cerca">
          <Tabs.List>
            <Tabs.Tab value="cerca" label="Cerca" icon={Search} />
            <Tabs.Tab value="nuovo" label="Nuovo" icon={Plus} />
            <Tabs.Tab value="cestino" label="Cestino" icon={Trash} disabled />
          </Tabs.List>
          <Tabs.Panel value="cerca">
            <Skeleton.Text lines={2} />
          </Tabs.Panel>
          <Tabs.Panel value="nuovo">
            <Typography>Niente qui, è solo per vedere il passaggio.</Typography>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </>
  );
}
