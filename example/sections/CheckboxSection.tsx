import { useMemo, useState } from 'react';
import {
  DashFormProvider,
  useDashFormContext,
  useDashFormState,
} from '@dashforge/forms';
import { Button, Card, Checkbox, Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Caption, Label, Row } from '../ui';

const TOPICS = ['Novità', 'Offerte', 'Aggiornamenti prodotto'] as const;

/** The payload, shown as it would leave for the backend. */
function Payload({ value }: { value: unknown }) {
  const s = useTheme().semantic;
  return (
    <Typography
      variant="mono"
      sx={{
        backgroundColor: s.surface.sunken,
        color: s.text.primary,
        borderRadius: s.radius.control,
        padding: 12,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Typography>
  );
}

function Fields({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  const { rhf } = useDashFormContext();
  const { isDirty } = useDashFormState();

  return (
    <>
      <Checkbox name="newsletter" label="Iscrivimi alla newsletter" />
      <Checkbox
        name="terms"
        label="Accetto i termini di servizio"
        required
        rules={{ required: 'Serve il consenso per continuare' }}
      />
      <Checkbox
        name="profiling"
        label="Consenso alla profilazione"
        helperText="Puoi cambiarlo in qualsiasi momento dalle impostazioni."
      />
      <Row>
        <Button onPress={() => void rhf.handleSubmit(onSubmit)()}>Invia</Button>
        <Button
          variant="outline"
          color="secondary"
          onPress={() => rhf.reset()}
          disabled={!isDirty}
        >
          Azzera
        </Button>
      </Row>
    </>
  );
}

export function CheckboxSection() {
  const [simple, setSimple] = useState(false);
  const [picked, setPicked] = useState<string[]>([TOPICS[0]]);
  const [payload, setPayload] = useState<unknown>(null);

  const all = picked.length === TOPICS.length;
  const some = picked.length > 0 && !all;

  const toggleTopic = useMemo(
    () => (topic: string, on: boolean) =>
      setPicked(list =>
        on ? [...list, topic] : list.filter(t => t !== topic),
      ),
    [],
  );

  return (
    <>
      <Card>
        <Card.Header
          title="Il valore è un booleano"
          subtitle="Il primo controllo qui che non passa una stringa"
        />
        <Caption>
          TextField aveva dimostrato il bridge per il testo. Un booleano è dove
          di solito si scopre che un renderer stava passando tutto per String():
          undefined diventerebbe la stringa "undefined", che è vera. Premi Invia
          e guarda cosa esce.
        </Caption>
        <DashFormProvider>
          <Fields onSubmit={setPayload} />
        </DashFormProvider>
        {payload ? <Payload value={payload} /> : null}
        <Caption>
          Le caselle mai toccate arrivano comunque come false e non come chiave
          mancante: non spuntato è una risposta, non un'assenza. Il consenso ai
          termini è obbligatorio, quindi finché manca la submit non passa.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Indeterminato"
          subtitle="La casella che ne governa altre"
        />
        <Checkbox
          label="Tutti gli argomenti"
          checked={all}
          indeterminate={some}
          onCheckedChange={on => setPicked(on ? [...TOPICS] : [])}
        />
        {TOPICS.map(topic => (
          <Checkbox
            key={topic}
            label={topic}
            checked={picked.includes(topic)}
            onCheckedChange={on => toggleTopic(topic, on)}
            sx={{ root: { marginLeft: 28 } }}
          />
        ))}
        <Caption>
          Lo stato misto è annunciato e non solo disegnato: una casella che
          sembra indeterminata ma dice "non spuntata" a chi usa VoiceOver dà una
          risposta sbagliata, non una mancante. Da lì il tocco porta a spuntato,
          che è quello che deve fare una casella padre.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Misure" subtitle="18 / 20 / 24" />
        <Checkbox size="sm" label="Piccola" defaultChecked />
        <Checkbox size="md" label="Media" defaultChecked />
        <Checkbox size="lg" label="Grande" defaultChecked />
        <Caption>
          La casella è piccola, il bersaglio no: hitSlop porta anche la piccola
          oltre i 44pt, e tutta la riga con l'etichetta è premibile, perché una
          parola si centra meglio di un quadratino.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Stati" />
        <Checkbox label="Spenta" checked={simple} onCheckedChange={setSimple} />
        <Checkbox label="Disabilitata" disabled />
        <Checkbox label="Disabilitata e spuntata" disabled defaultChecked />
        <Checkbox
          label="Non valida"
          error
          helperText="Devi accettare per continuare"
        />
        <Checkbox label="Etichetta lunga che va a capo su più righe per mostrare che la casella resta allineata alla prima riga e non al blocco" />
      </Card>
    </>
  );
}
