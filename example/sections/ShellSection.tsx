import { useState } from 'react';
import { View } from 'react-native';
import {
  Accordion,
  Badge,
  Button,
  FAB,
  Header,
  IconButton,
  Popover,
  TabBar,
  Typography,
} from '@dashforge/rn';
import type { TabBarValue } from '@dashforge/rn';
import { Card, Caption } from '../ui';
import { Close, More, Plus, Search, Trash } from '../icons';
import { showActionSheet } from '../dialogs';

export function ShellSection() {
  const [where, setWhere] = useState<TabBarValue>('home');
  const [tip, setTip] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <>
      <Card>
        <Card.Header
          title="Disegnano, non navigano"
          subtitle="Header, TabBar, FAB"
        />
        <Caption>
          ARCHITECTURE.md dice che la navigazione è di react-navigation e che
          questa libreria non reimplementa un router. Un Header che chiamasse
          goBack() avrebbe reimplementato l'unica parte di un router che qualcuno
          nota. Qui onBack viene avvisato, e cosa significhi lo decide chi ha il
          navigatore.
        </Caption>
      </Card>

      <Card padding="none">
        <Header
          title="Ordini"
          subtitle="Ultimi 30 giorni"
          onBack={() => setPressed('indietro')}
          actions={
            <IconButton
              icon={Search}
              variant="ghost"
              color="secondary"
              accessibilityLabel="Cerca"
              onPress={() => setPressed('cerca')}
            />
          }
        />
        <View style={{ padding: 16 }}>
          <Typography color="muted">
            {pressed ? `Premuto: ${pressed}` : 'Premi la freccia o la lente.'}
          </Typography>
        </View>
        <Header title="Centrato, senza linea" centerTitle divider={false} />
      </Card>

      <Card padding="none">
        <View style={{ height: 120, justifyContent: 'flex-end' }}>
          <FAB
            icon={Plus}
            accessibilityLabel="Nuovo ordine"
            onPress={() => setPressed('nuovo')}
            position="none"
            sx={{ root: { alignSelf: 'flex-end', margin: 16 } }}
          />
        </View>
        <TabBar
          value={where}
          onValueChange={setWhere}
          accessibilityLabel="Sezioni"
          items={[
            { value: 'home', label: 'Home', icon: Plus },
            {
              value: 'inbox',
              label: 'Posta',
              icon: Search,
              badge: <Badge count={3} color="danger" />,
            },
            { value: 'more', label: 'Altro', icon: More },
          ]}
        />
      </Card>

      <Card>
        <Caption>
          Il FAB richiede accessibilityLabel. È l'unico componente della libreria
          senza testo su cui ripiegare: un cerchio con un più dentro viene
          annunciato come niente, e renderla obbligatoria è l'unico modo perché
          non venga dimenticata.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Popover" subtitle="Non è un dialogo, e la differenza è lo scrim" />
        <Caption>
          Un dialogo oscura la pagina perché la pagina può aspettare. Un popover
          la lascia leggibile perché parla di qualcosa che sta lì sopra, e il
          livello dietro serve solo a raccogliere il tocco che lo chiude. Si
          gira sopra l'ancora quando sotto non c'è spazio.
        </Caption>
        <Popover
          open={tip}
          onClose={() => setTip(false)}
          label="Cos'è"
          anchor={
            <Button variant="outline" color="secondary" onPress={() => setTip(true)}>
              Spiegami
            </Button>
          }
        >
          <Typography>
            Misura la sua ancora invece di chiedere una ref: una ref da infilare
            è una ref che qualcuno dimentica, e il difetto è silenzioso.
          </Typography>
        </Popover>
      </Card>

      <Card>
        <Card.Header
          title="ActionSheet"
          subtitle="Su iOS è quello di sistema, su Android è il nostro"
        />
        <Caption>
          Il bucket tre di ARCHITECTURE.md nomina gli action sheet come
          superficie di sistema: delegare, mai reimplementare. Su iOS questo
          chiede ad ActionSheetIOS e non disegna niente. Android non ha una
          superficie equivalente a cui delegare, quindi lì il foglio lo
          disegniamo noi. La chiamata è la stessa.
        </Caption>
        <Button
          onPress={async () => {
            const choice = await showActionSheet({
              title: 'La foto del profilo',
              message: 'Da dove la prendiamo?',
              options: [
                { key: 'camera', label: 'Scatta una foto' },
                { key: 'library', label: 'Scegli dalla galleria' },
                { key: 'remove', label: 'Rimuovi', destructive: true },
              ],
            });
            setPicked(choice ?? 'annullato');
          }}
        >
          Apri il foglio
        </Button>
        <Typography color="muted">
          {picked ? `Scelto: ${picked}` : 'Niente ancora.'}
        </Typography>
      </Card>

      <Card padding="none">
        <Accordion defaultValue={['spedizione']}>
          <Accordion.Item
            value="spedizione"
            title="Quanto ci mette la spedizione?"
            icon={Plus}
          >
            <Typography>
              Due giorni lavorativi in Italia, cinque per il resto d'Europa.
            </Typography>
          </Accordion.Item>
          <Accordion.Item value="reso" title="Posso rendere quello che ho comprato?">
            <Typography>
              Entro quattordici giorni, nella confezione originale.
            </Typography>
          </Accordion.Item>
          <Accordion.Item value="spento" title="Questa è spenta" icon={Close} disabled>
            <Typography>Non si apre.</Typography>
          </Accordion.Item>
        </Accordion>
      </Card>

      <Card>
        <Card.Header title="Accordion" subtitle="Il pannello nasce quando si apre" />
        <Caption>
          Non tenuto nascosto: è quello che rende l'apertura un'animazione invece
          che un salto, perché il pannello viene misurato nel frame in cui
          compare e la scatola attorno cresce da zero fino a lì. Vuol dire anche
          che venti risposte sono venti intestazioni finché qualcuno non ne
          chiede una.
        </Caption>
      </Card>
    </>
  );
}
