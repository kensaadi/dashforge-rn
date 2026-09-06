import { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Modal,
  Stack,
  Typography,
} from '@dashforge/rn';
import { Caption } from '../ui';

export function ModalSection() {
  const [destructive, setDestructive] = useState(false);
  const [required, setRequired] = useState(false);
  const [wide, setWide] = useState(false);
  const [long, setLong] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [deleted, setDeleted] = useState(0);

  return (
    <>
      <Card>
        <Card.Header
          title="Un pannello sopra la pagina oscurata"
          subtitle="Il primo componente che esce dal flusso"
        />
        <Caption>
          Costruito sopra il Modal di React Native, al contrario dello Switch.
          Quello l'ho rifiutato perché esponeva due colori e nessuna geometria;
          questo è infrastruttura e non aspetto. È quello che tira davvero il
          contenuto fuori dall'albero di layout, risponde al tasto indietro di
          Android e mette il pannello sopra la barra di stato. Rifiutarlo
          vorrebbe dire scrivere un portale, e sarebbe peggiore.
        </Caption>
        <Caption>
          Anche i token che aspettavano: overlay.scrim e il gradino modal della
          scala di elevazione non li usava nessuno.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Conferma distruttiva"
          subtitle="Quella che la sezione Card scriveva senza avere dove aprirla"
        />
        <Button color="danger" onPress={() => setDestructive(true)}>
          Elimina il progetto
        </Button>
        <Caption>{`Eliminato ${deleted} volte.`}</Caption>
      </Card>

      <Modal
        open={destructive}
        onClose={() => setDestructive(false)}
        label="Elimina il progetto"
      >
        <Modal.Header
          title="Elimina il progetto"
          subtitle="Diciannove file e tre anni di cronologia. Non si torna indietro."
        />
        <Modal.Footer divider>
          <Button
            size="sm"
            variant="ghost"
            color="secondary"
            onPress={() => setDestructive(false)}
          >
            Annulla
          </Button>
          <Button
            size="sm"
            color="danger"
            onPress={() => {
              setDeleted(n => n + 1);
              setDestructive(false);
            }}
          >
            Elimina
          </Button>
        </Modal.Footer>
      </Modal>

      <Card>
        <Card.Header title="Composto come una scheda" />
        <Caption>
          Modal.Header e Modal.Footer sono i componenti della Card. Il titolo di
          un dialogo è il titolo di una scheda, e averne due vorrebbe dire due
          cose da tenere allineate. Il pannello presta loro il contesto, quindi
          la riga del footer sborda fino ai bordi come farebbe in una scheda.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Non si chiude da solo" subtitle="Chiede, e basta" />
        <Caption>
          Lo scrim e il tasto indietro chiamano onClose e non succede altro
          finché non lo decidi tu. Lo stato che dice se è aperto resta in un
          posto solo.
        </Caption>
        <Stack direction="row" gap="inline">
          <Button
            variant="outline"
            color="secondary"
            onPress={() => setRequired(true)}
          >
            Non chiudibile
          </Button>
          <Button
            variant="outline"
            color="secondary"
            onPress={() => setWide(true)}
          >
            Largo
          </Button>
          <Button
            variant="outline"
            color="secondary"
            onPress={() => setLong(true)}
          >
            Lungo
          </Button>
        </Stack>
        <Caption>
          Il primo non ha via d'uscita che non sia un bottone, e vale la pena
          intenderlo davvero: un dialogo così deve valere l'interruzione.
        </Caption>
      </Card>

      <Modal
        open={required}
        dismissible={false}
        label="Termini aggiornati"
        size="sm"
      >
        <Modal.Header
          title="Termini aggiornati"
          subtitle="Serve una risposta per proseguire."
        />
        <Checkbox
          label="Ho letto e accetto"
          checked={accepted}
          onCheckedChange={setAccepted}
        />
        <Modal.Footer divider>
          <Button
            size="sm"
            disabled={!accepted}
            onPress={() => {
              setRequired(false);
              setAccepted(false);
            }}
          >
            Continua
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal open={wide} onClose={() => setWide(false)} size="lg" label="Largo">
        <Modal.Header
          title="size=lg"
          subtitle="Su un telefono il margine dello schermo arriva prima"
        />
        <Typography color="muted">
          Le tre misure servono ai tablet: qui la larghezza la decide il
          margine, non il massimo.
        </Typography>
        <Modal.Footer>
          <Button size="sm" onPress={() => setWide(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal open={long} onClose={() => setLong(false)} label="Lungo">
        <Modal.Header
          title="Contenuto alto"
          subtitle="Il pannello smette di crescere"
        />
        {Array.from({ length: 14 }).map((_, i) => (
          <Typography key={i} color="muted">
            {`Riga ${i + 1} di un contenuto che non ci sta.`}
          </Typography>
        ))}
        <Modal.Footer divider>
          <Button size="sm" onPress={() => setLong(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      <Card>
        <Card.Header title="Il contenuto alto è tuo" />
        <Caption>
          Il pannello smette di crescere all'85% dello schermo e non scrolla da
          solo: una regione scrollabile dentro dovrebbe decidere se il footer
          scorre col contenuto, e quella è una decisione su quel dialogo, non
          sui dialoghi. Aprendo "Lungo" vedi dove si ferma.
        </Caption>
      </Card>
    </>
  );
}
