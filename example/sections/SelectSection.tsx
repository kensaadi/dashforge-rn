import { useState } from 'react';
import { DashFormProvider, useDashFormContext } from '@dashforge/forms';
import { Button, Card, Select, Typography } from '@dashforge/rn';
import type { RadioValue } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Caption } from '../ui';

const REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
];

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
  return (
    <>
      <Select
        name="plan"
        label="Piano"
        placeholder="Scegli un piano"
        required
        rules={{ required: 'Serve un piano' }}
      >
        <Select.Option value={1} label="Base, 9 € al mese" />
        <Select.Option value={2} label="Pro, 19 € al mese" />
        <Select.Option value={3} label="Team, 49 € al mese" />
      </Select>
      <Select name="region" label="Regione" placeholder="Scegli">
        {REGIONS.map(r => (
          <Select.Option key={r} value={r} label={r} />
        ))}
      </Select>
      <Button onPress={() => void rhf.handleSubmit(onSubmit)()}>Invia</Button>
    </>
  );
}

export function SelectSection() {
  const [size, setSize] = useState<RadioValue>('md');
  const [region, setRegion] = useState<RadioValue | undefined>(undefined);
  const [empty, setEmpty] = useState<RadioValue | undefined>(undefined);
  const [invalid, setInvalid] = useState<RadioValue | undefined>(undefined);
  const [payload, setPayload] = useState<unknown>(null);

  return (
    <>
      <Card>
        <Card.Header
          title="Composto, non disegnato"
          subtitle="Un Modal con dentro un RadioGroup"
        />
        <Caption>
          Il controllo chiuso è suo; quello che si apre è un Modal con dentro un
          RadioGroup, perché una risposta fra tante ha già un componente e
          quello si annuncia già come gruppo di radio. Disegnare le righe qui
          vorrebbe dire una seconda implementazione della stessa idea, diversa
          nei dettagli che nessuno guarda finché non li trova un lettore di
          schermo.
        </Caption>
        <Select
          label="Taglia"
          value={size}
          onValueChange={setSize}
          helperText="Il controllo chiuso dice cosa c'è dentro."
        >
          <Select.Option value="sm" label="Piccola" />
          <Select.Option value="md" label="Media" />
          <Select.Option value="lg" label="Grande" />
          <Select.Option value="xl" label="Esaurita" disabled />
        </Select>
      </Card>

      <Card>
        <Card.Header
          title="Una lista lunga"
          subtitle="La lista scorre, il pannello no"
        />
        <Select
          label="Regione"
          placeholder="Scegli una regione"
          title="Dove abiti"
        >
          {REGIONS.map(r => (
            <Select.Option key={r} value={r} label={r} />
          ))}
        </Select>
        <Caption>
          È la decisione che il Modal lascia di proposito a chi lo usa, e un
          select è uno che ha una risposta ovvia: l'intestazione resta, le
          scelte si muovono.
        </Caption>
        <Caption>
          Con `title` la lista può chiedere una cosa e il campo chiamarsi in un
          altro modo, ma di norma è lo stesso: una lista che fa una domanda
          diversa dal campo che riempie è più spesso una svista che una
          sottigliezza.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Stati" />
        <Select
          label="Vuoto"
          placeholder="Niente scelto"
          value={empty}
          onValueChange={setEmpty}
        >
          <Select.Option value="a" label="A" />
          <Select.Option value="b" label="B" />
        </Select>
        <Select
          label="Disabilitato"
          placeholder="Non si apre"
          disabled
          value={undefined}
          onValueChange={() => {}}
        >
          <Select.Option value="a" label="A" />
        </Select>
        <Select
          label="Non valido"
          placeholder="Scegli"
          error
          helperText="Serve una scelta per continuare"
          value={invalid}
          onValueChange={setInvalid}
        >
          <Select.Option value="a" label="A" />
        </Select>
        <Caption>
          Il segnaposto è colorato come tale: non è un valore, non viene mai
          inviato, e sparisce alla prima scelta.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Dentro un form"
          subtitle="Stesso contratto del RadioGroup"
        />
        <DashFormProvider>
          <Fields onSubmit={setPayload} />
        </DashFormProvider>
        {payload ? <Payload value={payload} /> : null}
        <Caption>
          Il piano è tenuto per id e arriva come numero. E come il RadioGroup e
          a differenza della Checkbox, questo non si semina: niente scelto è
          l'assenza di una risposta, non una risposta. Prova a inviare senza
          scegliere il piano.
        </Caption>
      </Card>
    </>
  );
}
