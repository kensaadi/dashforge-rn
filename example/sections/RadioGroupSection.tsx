import { useState } from 'react';
import { DashFormProvider, useDashFormContext } from '@dashforge/forms';
import { Button, Card, RadioGroup, Typography } from '@dashforge/rn';
import type { RadioValue } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Caption } from '../ui';

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

const PLANS = [
  { id: 1, label: 'Base, 9 € al mese' },
  { id: 2, label: 'Pro, 19 € al mese' },
  { id: 3, label: 'Team, 49 € al mese' },
];

function Fields({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  const { rhf } = useDashFormContext();
  return (
    <>
      <RadioGroup
        name="plan"
        label="Piano"
        required
        rules={{ required: 'Scegli un piano' }}
      >
        {PLANS.map(p => (
          <RadioGroup.Option key={p.id} value={p.id} label={p.label} />
        ))}
      </RadioGroup>
      <RadioGroup name="billing" label="Fatturazione" orientation="horizontal">
        <RadioGroup.Option value="monthly" label="Mensile" />
        <RadioGroup.Option value="yearly" label="Annuale" />
      </RadioGroup>
      <Button onPress={() => void rhf.handleSubmit(onSubmit)()}>Invia</Button>
    </>
  );
}

export function RadioGroupSection() {
  const [shipping, setShipping] = useState<RadioValue>('standard');
  const [payload, setPayload] = useState<unknown>(null);

  return (
    <>
      <Card>
        <Card.Header
          title="Il gruppo possiede il campo"
          subtitle="Più controlli, una risposta sola"
        />
        <Caption>
          È la forma che lo separa da tutti gli altri: TextField, Checkbox e
          Switch possiedono ognuno il proprio campo, qui più controlli ne
          condividono uno e nessuno di loro lo possiede. Un'opzione non ha name,
          non ha rules e non si registra: offre un valore, e cosa significhi lo
          decide il gruppo.
        </Caption>
        <RadioGroup
          label="Consegna"
          value={shipping}
          onValueChange={setShipping}
          helperText="Puoi cambiarla fino alla spedizione."
        >
          <RadioGroup.Option value="standard" label="Standard, 3 giorni" />
          <RadioGroup.Option value="express" label="Express, domani" />
          <RadioGroup.Option value="pickup" label="Ritiro in negozio" />
        </RadioGroup>
      </Card>

      <Card>
        <Card.Header
          title="Dentro un form"
          subtitle="Una chiave sola nel payload"
        />
        <DashFormProvider>
          <Fields onSubmit={setPayload} />
        </DashFormProvider>
        {payload ? <Payload value={payload} /> : null}
        <Caption>
          Il piano è tenuto per id, e il numero arriva nel payload come numero:
          un insieme di opzioni è chiavato per id tanto spesso quanto per slug,
          e il valore passa senza conversioni.
        </Caption>
        <Caption>
          Questo non si semina come Checkbox e Switch. Una casella non spuntata
          è una risposta, "no"; un gruppo mai toccato è l'assenza di una
          risposta, e scrivere un default sarebbe inventare una scelta che
          l'utente non ha fatto. Prova a inviare senza scegliere il piano.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Orientamento"
          subtitle="In colonna, o in riga che va a capo"
        />
        <RadioGroup label="Taglia" orientation="horizontal" defaultValue="m">
          <RadioGroup.Option value="s" label="S" />
          <RadioGroup.Option value="m" label="M" />
          <RadioGroup.Option value="l" label="L" />
          <RadioGroup.Option value="xl" label="XL" />
        </RadioGroup>
      </Card>

      <Card>
        <Card.Header title="Misure e stati" />
        <RadioGroup label="Piccolo" size="sm" defaultValue="a">
          <RadioGroup.Option value="a" label="Scelta" />
          <RadioGroup.Option value="b" label="Non scelta" />
        </RadioGroup>
        <RadioGroup label="Grande" size="lg" defaultValue="a">
          <RadioGroup.Option value="a" label="Scelta" />
          <RadioGroup.Option value="b" label="Non scelta" />
        </RadioGroup>
        <RadioGroup label="Gruppo disabilitato" disabled defaultValue="a">
          <RadioGroup.Option value="a" label="Scelta" />
          <RadioGroup.Option value="b" label="Non scelta" />
        </RadioGroup>
        <RadioGroup label="Una sola opzione disabilitata" defaultValue="a">
          <RadioGroup.Option value="a" label="Disponibile" />
          <RadioGroup.Option value="b" label="Esaurita" disabled />
        </RadioGroup>
        <RadioGroup
          label="Non valido"
          error
          helperText="Scegli un'opzione per continuare"
          defaultValue="b"
        >
          <RadioGroup.Option value="a" label="Prima" />
          <RadioGroup.Option value="b" label="Seconda" />
        </RadioGroup>
        <Caption>
          Il bordo rosso sta sui cerchi senza risposta: arrossare quello scelto
          direbbe che la risposta è sbagliata, quando quello che manca è che non
          ce n'è una.
        </Caption>
      </Card>
    </>
  );
}
