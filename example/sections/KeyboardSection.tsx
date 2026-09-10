import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DashFormProvider } from '@dashforge/forms';
import {
  Avatar,
  BottomSheet,
  Button,
  KeyboardAvoidingContainer,
  ListItem,
  NumberField,
  Stack,
  TextField,
  Textarea,
  Typography,
  useRefreshControl,
} from '@dashforge/rn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Caption } from '../ui';

const NAMES = [
  'Kenjy Saadi',
  'Ada Byron King',
  'Grace Hopper',
  'Alan Turing',
  'Barbara Liskov',
  'Margaret Hamilton',
];

function Feed() {
  const [rows, setRows] = useState(NAMES.slice(0, 4));
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useRefreshControl({
    refreshing,
    onRefresh: () => {
      setRefreshing(true);
      setTimeout(() => {
        setRows(r => [...r].reverse());
        setRefreshing(false);
      }, 1200);
    },
    accessibilityLabel: 'Aggiorno l’elenco',
  });

  // A `ScrollView` and not a `FlatList` **only because this demo lives
  // inside the playground's own scroll view**, and React Native refuses
  // to nest a virtualised list inside one. The hook is the same prop
  // either way; a real screen puts the `FlatList` at the top and hands
  // it exactly this.
  return (
    <ScrollView style={{ height: 260 }} refreshControl={refresh}>
      {rows.map(name => (
        <ListItem key={name} leading={<Avatar name={name} size="sm" />} title={name} />
      ))}
    </ScrollView>
  );
}

export function KeyboardSection() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <Card.Header
          title="La tastiera"
          subtitle="Le due piattaforme non vogliono la stessa cosa"
        />
        <Caption>
          Android ridimensiona la finestra da solo con adjustResize, quindi
          aggiungerci del padding sopra spinge il contenuto due volte e lascia
          una fascia di schermo vuoto sopra la tastiera. iOS non fa niente da
          solo e il padding gli serve. È tutto il motivo per cui questo è un
          componente e non una riga a ogni chiamata.
        </Caption>
        <Caption>
          E porta con sé le due impostazioni che una form vuole davvero: un tap
          arriva al pulsante su cui è atterrato invece di essere speso a
          chiudere la tastiera, e trascinare la pagina la mette via.
        </Caption>
        <Button onPress={() => setOpen(true)}>Apri la form</Button>
      </Card>

      <Card>
        <Card.Header
          title="Pull to refresh"
          subtitle="Un hook, perché React Native non lascia altra scelta"
        />
        <Caption>
          Il controllo di refresh è una prop di una scroll view, non qualcosa
          che si possa avvolgere attorno a una: un componente wrapper non
          riuscirebbe a raggiungere la lista che sta avvolgendo. Un hook entra
          in una ScrollView, in una FlatList e nel SurfaceViewport senza che
          nessuno dei tre sappia della sua esistenza.
        </Caption>
        <Caption>
          Tira giù la lista qui sotto. Qui dentro è una ScrollView e non una
          FlatList solo perché il playground è già una pagina che scorre, e
          React Native si rifiuta di annidare una lista virtualizzata dentro
          un'altra: la prop è la stessa nei due casi.
        </Caption>
      </Card>

      <Card padding="none">
        <Feed />
      </Card>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.9]}
        radius="lg"
        label="Nuova nota"
        bottomInset={insets.bottom}
      >
        <KeyboardAvoidingContainer offset={insets.top}>
          <DashFormProvider>
            <Stack gap="stack">
              <Typography variant="title">Nuova nota</Typography>
              <TextField name="titolo" label="Titolo" fullWidth />
              <NumberField name="pezzi" label="Pezzi" min={1} integer steppers />
              <Textarea
                name="corpo"
                label="Corpo"
                rows={4}
                placeholder="Questo campo sta in fondo apposta"
              />
              <Button onPress={() => setOpen(false)}>Salva</Button>
              <View style={{ height: 40 }} />
            </Stack>
          </DashFormProvider>
        </KeyboardAvoidingContainer>
      </BottomSheet>
    </>
  );
}
