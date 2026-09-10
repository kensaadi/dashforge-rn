import { useState } from 'react';
import { Avatar, List, ListItem, SwipeableRow } from '@dashforge/rn';
import { Card, Caption } from '../ui';
import { Trash, Search } from '../icons';

type Message = { id: string; from: string; subject: string };

const INBOX: Message[] = [
  { id: '1', from: 'Kenjy Saadi', subject: 'Il preventivo di marzo' },
  { id: '2', from: 'Ada Byron King', subject: 'Note sulla macchina analitica' },
  { id: '3', from: 'Grace Hopper', subject: 'Trovato un baco' },
  { id: '4', from: 'Alan Turing', subject: 'Domanda sulla macchina' },
];

export function SwipeSection() {
  const [messages, setMessages] = useState(INBOX);
  const [last, setLast] = useState<string | null>(null);

  const remove = (id: string) => setMessages(m => m.filter(x => x.id !== id));

  return (
    <>
      <Card>
        <Card.Header
          title="L'arbitraggio, di nuovo"
          subtitle="E questa volta la risposta è l'opposta"
        />
        <Caption>
          Un BottomSheet prende il gesto al tocco perché dentro una Modal non
          gliene viene offerto un altro. Una riga dentro una lista non può:
          prendere ogni tocco vorrebbe dire ingoiare i tap e fermare lo scroll.
          Quindi questa lo prende al primo movimento, e solo quando il movimento
          è chiaramente laterale.
        </Caption>
        <Caption>
          Trascina una riga verso sinistra. Una riga alla volta resta aperta, in
          tutta l'applicazione: aprire questa chiude quella di prima.
        </Caption>
      </Card>

      <Card padding="none">
        <List divider="inset">
          {messages.map(m => (
            <SwipeableRow
              key={m.id}
              rightActions={[
                {
                  key: 'read',
                  label: 'Letto',
                  icon: Search,
                  onPress: () => setLast(`Segnato letto: ${m.from}`),
                },
                {
                  key: 'delete',
                  label: 'Elimina',
                  icon: Trash,
                  color: 'danger',
                  onPress: () => {
                    setLast(`Eliminato: ${m.from}`);
                    remove(m.id);
                  },
                },
              ]}
              leftActions={[
                {
                  key: 'pin',
                  label: 'Fissa',
                  color: 'warning',
                  onPress: () => setLast(`Fissato: ${m.from}`),
                },
              ]}
            >
              <ListItem
                leading={<Avatar name={m.from} size="sm" />}
                title={m.from}
                subtitle={m.subject}
              />
            </SwipeableRow>
          ))}
        </List>
      </Card>

      <Card>
        <Caption>
          {last ?? 'Nessuna azione ancora. Trascina una riga verso sinistra, o verso destra.'}
        </Caption>
        <Caption>
          Ogni azione è anche un'azione di accessibilità sulla riga: uno swipe
          non è un gesto che uno screen reader può fare, quindi le azioni sono
          raggiungibili dal rotore senza che la riga venga mai aperta.
        </Caption>
      </Card>
    </>
  );
}
