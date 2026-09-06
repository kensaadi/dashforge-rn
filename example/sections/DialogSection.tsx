import { useState } from 'react';
import { Button, Card, Stack, Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { ask } from '../dialogs';
import { Caption } from '../ui';

/** Stands in for the store or the service that would really do this. */
async function saveProject(log: (line: string) => void) {
  const answer = await ask({
    title: 'Vuoi salvare?',
    message: 'Le modifiche non salvate andranno perse.',
    actions: [
      { value: 'discard', label: 'Non salvare' },
      { value: 'save', label: 'Salva' },
    ],
  });

  if (answer === 'save') log('PUT /projects/1 inviata');
  else if (answer === 'discard') log('Modifiche scartate');
  else log('Chiuso senza rispondere');
}

export function DialogSection() {
  const [log, setLog] = useState<string[]>([]);
  const [name, setName] = useState('Progetto senza nome');
  const s = useTheme().semantic;

  const write = (line: string) => setLog(l => [line, ...l].slice(0, 6));

  return (
    <>
      <Card>
        <Card.Header
          title="Chiedere da codice"
          subtitle="Nessun JSX dalla parte di chi chiede"
        />
        <Caption>
          Le azioni sono dati e la risposta è il valore della promessa, quindi
          niente callback e niente contesto: ogni azione chiude, perché chiudere
          non è una cosa che fa un bottone, è quello che succede quando hai
          risposto. Il flusso si legge in fila.
        </Caption>
        <Button onPress={() => void saveProject(write)}>
          Salva il progetto
        </Button>
        <Caption>
          Il tipo della risposta è "discard" oppure "save" oppure null, senza
          che nessuno lo dichiari: viene dedotto dalle azioni.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Distruttiva"
          subtitle="kind colora solo la risposta affermativa"
        />
        <Caption>
          Non tinge il pannello: un dialogo che si colora tutto sta urlando, e
          le due piattaforme risolvono la stessa cosa allo stesso modo,
          colorando il bottone che fa la cosa.
        </Caption>
        <Button
          color="danger"
          onPress={async () => {
            const answer = await ask({
              kind: 'danger',
              title: 'Eliminare il progetto?',
              message:
                'Diciannove file e tre anni di cronologia. Non si torna indietro.',
              actions: [
                { value: 'cancel', label: 'Annulla' },
                { value: 'delete', label: 'Elimina' },
              ],
            });
            write(
              answer === 'delete'
                ? 'DELETE /projects/1 inviata'
                : 'Niente da fare',
            );
          }}
        >
          Elimina il progetto
        </Button>
      </Card>

      <Card>
        <Card.Header title="Più di due risposte" subtitle="Si impilano" />
        <Button
          variant="outline"
          color="secondary"
          onPress={async () => {
            const answer = await ask({
              title: 'Come procediamo?',
              actions: [
                { value: 'now', label: 'Pubblica adesso' },
                { value: 'later', label: 'Programma per domani' },
                { value: 'draft', label: 'Tieni in bozza' },
              ],
            });
            write(`Scelto: ${answer ?? 'niente'}`);
          }}
        >
          Pubblica
        </Button>
      </Card>

      <Card>
        <Card.Header
          title="Un dialogo registrato"
          subtitle="Quando il dialogo è davvero un pezzo di interfaccia"
        />
        <Caption>
          Ha un campo, valida, e risponde con quello che è stato scritto. Il JSX
          vive nel livello di vista, dietro un nome che la logica può tenere
          senza importare niente. Il tipo di ritorno lo dà la sua stessa close.
        </Caption>
        <Typography>{`Nome attuale: ${name}`}</Typography>
        <Button
          variant="outline"
          color="secondary"
          onPress={async () => {
            const next = await ask({
              dialog: 'renameProject',
              props: { current: name },
            });
            if (next) {
              setName(next);
              write(`PATCH /projects/1 { name: "${next}" }`);
            } else {
              write('Rinomina annullata');
            }
          }}
        >
          Rinomina
        </Button>
      </Card>

      <Card>
        <Card.Header title="Cosa è successo" />
        {log.length === 0 ? (
          <Caption>Niente ancora. Prova uno dei bottoni qui sopra.</Caption>
        ) : (
          <Stack gap="inline">
            {log.map((line, i) => (
              <Typography
                key={`${line}-${i}`}
                variant="mono"
                sx={{
                  backgroundColor: s.surface.sunken,
                  color: s.text.primary,
                  borderRadius: s.radius.control,
                  padding: 10,
                }}
              >
                {line}
              </Typography>
            ))}
          </Stack>
        )}
      </Card>

      <Card>
        <Card.Header title="Le due regole" />
        <Caption>
          Una seconda ask mentre una è aperta rifiuta invece di accodarsi: due
          dialoghi non coesistono mai, quindi è un difetto di chi chiama, e
          accodarlo lo nasconderebbe riordinando una logica che nessuno ha
          scritto così.
        </Caption>
        <Caption>
          E ask senza host montato rifiuta pure, perché non c'è dove mostrarlo.
          L'host è uno solo per applicazione, il che è esattamente la stessa
          regola vista da un'altra parte.
        </Caption>
      </Card>
    </>
  );
}
