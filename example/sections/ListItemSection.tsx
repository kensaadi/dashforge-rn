import { useState } from 'react';
import { List, ListItem, Switch, Typography } from '@dashforge/rn';
import { Card, Caption } from '../ui';
import { Search, Trash, More, Plus } from '../icons';

export function ListItemSection() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <>
      <Card>
        <Card.Header
          title="La riga, non la tabella"
          subtitle="L'unità con cui si costruisce una schermata mobile"
        />
        <Caption>
          Quattro posti dove mettere qualcosa: uno slot iniziale, il titolo con
          il suo sottotitolo, un valore breve e uno slot finale. Il resto lo
          decide il componente, ed è esattamente il punto: le righe di una
          stessa app non devono divergere perché due persone le hanno costruite
          con Stack in giorni diversi.
        </Caption>
        <Caption>
          Una riga non ha un fondo suo. Viene lasciata cadere dentro una card,
          un foglio o la pagina, e qualsiasi colore dipingesse a riposo sarebbe
          giusto in uno di quei tre posti e sbagliato negli altri due. Dipinge
          solo mentre è premuta.
        </Caption>
      </Card>

      <Card padding="none">
        <List divider="inset">
          <ListItem
            icon={Search}
            title="Cerca"
            value="Ovunque"
            chevron
            onPress={() => setOpened('Cerca')}
          />
          <ListItem
            icon={Plus}
            title="Nuovo elemento"
            subtitle="Si apre una schermata a parte"
            chevron
            onPress={() => setOpened('Nuovo elemento')}
          />
          <ListItem
            icon={More}
            title="Altro"
            chevron
            onPress={() => setOpened('Altro')}
          />
          <ListItem icon={Trash} title="Svuota il cestino" value="2,4 GB" disabled />
        </List>
      </Card>

      <Card>
        <Caption>
          {opened
            ? `Ultima riga premuta: ${opened}.`
            : 'Premi una riga: la lista qui sopra è dentro una Card con padding="none", perché la riga si tiene già la sua aria.'}
        </Caption>
      </Card>

      <Card padding="none">
        <List>
          <ListItem
            title="Notifiche push"
            subtitle="Sul dispositivo"
            trailing={
              <Switch
                checked={push}
                onCheckedChange={setPush}
                accessibilityLabel="Notifiche push"
              />
            }
          />
          <ListItem
            title="Notifiche email"
            trailing={
              <Switch
                checked={email}
                onCheckedChange={setEmail}
                accessibilityLabel="Notifiche email"
              />
            }
          />
        </List>
      </Card>

      <Card>
        <Card.Header title="La riga con un comando dentro" />
        <Caption>
          Queste due righe non hanno onPress, e non è una dimenticanza. Il
          comando vince comunque la sua pressione, perché React Native chiede
          per prima la vista più profonda sotto il dito, ma uno screen reader
          si troverebbe un solo elemento che è insieme un pulsante e un
          interruttore e può dire una cosa sola. O la riga fa qualcosa, o
          contiene un comando.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Le linee"
          subtitle="Le disegna la lista, non la riga"
        />
        <Caption>
          full parte dal bordo, inset dal punto in cui inizia il titolo di una
          riga con icona, none non ne disegna. La prima linea non c'è perché la
          lista alza la colonna di esattamente uno spessore e ritaglia quello
          che esce: così una riga nascosta da access o visibleWhen non lascia
          dietro di sé due linee attaccate.
        </Caption>
      </Card>

      <Card padding="none">
        <List divider="full">
          <ListItem title="Prima" value="full" />
          <ListItem title="Seconda" value="full" />
          <ListItem
            title="Nascosta da visibleWhen"
            visibleWhen={() => false}
          />
          <ListItem title="Terza" value="full" />
        </List>
      </Card>

      <Card>
        <Card.Header title="Fuori da una lista" />
        <Typography color="muted">
          Una riga da sola non disegna nessuna linea: non c'è niente sopra da
          cui separarsi.
        </Typography>
        <ListItem
          title="Versione"
          value="0.0.0"
          sx={{ root: { paddingHorizontal: 0 } }}
        />
      </Card>
    </>
  );
}
