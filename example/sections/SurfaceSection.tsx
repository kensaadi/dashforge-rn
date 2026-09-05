import { useEffect, useRef, useState } from 'react';
import { Button, Card, Surface } from '@dashforge/rn';
import { Caption, Label, Row } from '../ui';

/**
 * Two backend services with different latencies, and a screen that
 * composes itself as each answer lands. The recommendation algorithm
 * takes a moment; once it answers, a second service starts a deeper
 * search over those same products and takes longer still.
 *
 * Nothing here is a notification. The point is that the user navigated
 * nowhere and the region spent its space more than once.
 */

type Stage = 'idle' | 'pending' | 'ready';

function useStagedFetch() {
  const [recs, setRecs] = useState<Stage>('idle');
  const [details, setDetails] = useState<Stage>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clear, []);

  const start = () => {
    clear();
    setRecs('pending');
    setDetails('idle');
    timers.current.push(
      setTimeout(() => {
        setRecs('ready');
        setDetails('pending');
      }, 1400),
    );
    timers.current.push(setTimeout(() => setDetails('ready'), 3600));
  };

  const reset = () => {
    clear();
    setRecs('idle');
    setDetails('idle');
  };

  return { recs, details, start, reset };
}

/** A block with a visible extent, so a region taking space is obvious. */
function Panel({
  tone,
  title,
  body,
}: {
  tone: 'raised' | 'sunken';
  title: string;
  body: string;
}) {
  return (
    <Card variant={tone === 'raised' ? 'outlined' : 'filled'}>
      <Card.Header title={title} subtitle={body} />
    </Card>
  );
}

export function SurfaceSection() {
  const { recs, details, start, reset } = useStagedFetch();
  const [first, setFirst] = useState(false);
  const [second, setSecond] = useState(false);

  return (
    <>
      <Card>
        <Label>Riempimento progressivo</Label>
        <Caption>
          Due servizi con latenze diverse. Il secondo parte solo quando il primo
          ha risposto, quindi "in corso" implica già che i consigliati sono
          arrivati: i due posti non si parlano mai pur restando coordinati.
        </Caption>
        <Row>
          <Button size="sm" onPress={start}>
            Entra nella home
          </Button>
          <Button size="sm" color="secondary" variant="outline" onPress={reset}>
            Azzera
          </Button>
        </Row>
        <Caption>{`consigliati: ${recs}   dettagli: ${details}`}</Caption>
      </Card>

      <Card>
        <Label>Posto 1, con riserva</Label>
        <Caption>
          Ha una riserva, quindi tiene sempre il posto: mostra i più venduti
          finché non sa fare di meglio.
        </Caption>
        <Surface>
          <Surface.Case when={recs === 'ready'}>
            <Panel
              tone="raised"
              title="Consigliati per te"
              body="5 prodotti scelti sul tuo storico. Senza questo avresti dovuto cercarli."
            />
          </Surface.Case>
          <Surface.Fallback>
            <Panel
              tone="sunken"
              title="I più venduti"
              body="Tutto quello che l'app sa di te al primo fotogramma."
            />
          </Surface.Fallback>
        </Surface>
      </Card>

      <Card>
        <Label>Posto 2, senza riserva</Label>
        <Caption>
          Nessuna riserva scritta, quindi finché non c'è niente da dire il posto
          non esiste e questa scheda si richiude. L'ordine delle condizioni
          rende inutile scrivere "dettagli pronti e non ancora arrivati".
        </Caption>
        <Surface>
          <Surface.Case when={details === 'ready'}>
            <Panel
              tone="raised"
              title="Opzioni dettagliate"
              body="Taglie, disponibilità e alternative sui prodotti qui sopra."
            />
          </Surface.Case>
          <Surface.Case when={details === 'pending'}>
            <Panel
              tone="sunken"
              title="Offerta del mese"
              body="Contenuto vero mentre il secondo servizio lavora, non un segnaposto."
            />
          </Surface.Case>
        </Surface>
      </Card>

      <Card>
        <Label>L'ordine è la priorità</Label>
        <Caption>
          Accendile entrambe: vince quella scritta più in alto. Due casi veri
          insieme non sono una situazione da gestire, sono senza ambiguità per
          costruzione.
        </Caption>
        <Row>
          <Button
            size="sm"
            color="secondary"
            variant={first ? 'solid' : 'outline'}
            onPress={() => setFirst(v => !v)}
          >
            Primo caso
          </Button>
          <Button
            size="sm"
            color="secondary"
            variant={second ? 'solid' : 'outline'}
            onPress={() => setSecond(v => !v)}
          >
            Secondo caso
          </Button>
        </Row>
        <Surface>
          <Surface.Case when={first}>
            <Panel
              tone="raised"
              title="Primo caso"
              body="Scritto per primo, quindi vince."
            />
          </Surface.Case>
          <Surface.Case when={second}>
            <Panel
              tone="sunken"
              title="Secondo caso"
              body="Si vede solo se il primo è falso."
            />
          </Surface.Case>
          <Surface.Fallback>
            <Panel tone="sunken" title="Riserva" body="Nessun caso vero." />
          </Surface.Fallback>
        </Surface>
      </Card>

      <Card>
        <Label>Quando il cambio ha il diritto di arrivare</Label>
        <Caption>
          Non è un dettaglio sull'animazione: è la domanda editoriale se il
          contenuto abbia il diritto di cambiare mentre l'utente sta facendo
          qualcosa. La regola è una riga: interrompere è legittimo quando non
          vedere costa qualcosa. Una richiesta di corsa entra adesso, perché
          ritardarla per lo scroll dell'autista gli costa soldi. Una lista di
          offerte non ha mai quel diritto.
        </Caption>
        <Row>
          <Button size="sm" onPress={start}>
            Entra nella home
          </Button>
          <Button size="sm" color="secondary" variant="outline" onPress={reset}>
            Azzera
          </Button>
        </Row>
        <Caption>
          Toccalo e scrolla subito: con settled, che è il default, le due
          regioni qui sopra aspettano che il dito si fermi. Qualsiasi cambio di
          altezza durante l'inerzia sposta il punto di atterraggio, e l'utente
          lancia il dito mirando a una cosa e arriva su un'altra.
        </Caption>
        <Surface commit="immediate">
          <Surface.Case when={recs === 'ready'}>
            <Panel
              tone="raised"
              title="Questa non aspetta"
              body="commit=immediate: entra anche mentre scrolli."
            />
          </Surface.Case>
        </Surface>
        <Caption>
          E se due regioni cambiano nello stesso istante non le vedi come due
          cambi, le vedi come l'app che sbatte le palpebre: quella più in basso
          parte un decimo di secondo dopo. È automatico e non ha nessuna prop.
        </Caption>
      </Card>

      <Card>
        <Label>Il viewport</Label>
        <Caption>
          React Native non ha nessuna nozione ambientale di "l'utente sta
          scrollando", e una regione non può sapere dove si trova rispetto a un
          viewport di cui nessuno le ha parlato. Il contenitore che scrolla va
          cablato, altrimenti settled non ha niente da aspettare e degrada a
          immediate con un avviso in sviluppo. Questo playground lo ha cablato:
          è il motivo per cui tutto qui sopra funziona.
        </Caption>
        <Caption>
          Le props che consegna includono maintainVisibleContentPosition, che è
          quello che tiene ferma la riga che stai leggendo quando il contenuto
          cresce sopra di essa. Su iOS c'è da tempo, su Android è arrivato dopo.
        </Caption>
      </Card>
    </>
  );
}
