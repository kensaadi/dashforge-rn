import { useState } from 'react';
import { DashFormProvider, useDashFormContext } from '@dashforge/forms';
import { Button, Card, Switch, Typography } from '@dashforge/rn';
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

function Fields({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  const { rhf } = useDashFormContext();
  return (
    <>
      <Switch name="push" side="start" label="Notifiche push" />
      <Switch
        name="marketing"
        side="start"
        label="Comunicazioni commerciali"
        helperText="Al massimo una al mese, promesso."
      />
      <Button onPress={() => void rhf.handleSubmit(onSubmit)()}>Invia</Button>
    </>
  );
}

export function SwitchSection() {
  const [dark, setDark] = useState(true);
  const [wifi, setWifi] = useState(false);
  const [payload, setPayload] = useState<unknown>(null);

  return (
    <>
      <Card>
        <Card.Header
          title="Una riga di impostazioni"
          subtitle="La differenza dalla Checkbox è quando conta la risposta"
        />
        <Switch label="Tema scuro" checked={dark} onCheckedChange={setDark} />
        <Switch
          label="Scarica solo via Wi-Fi"
          checked={wifi}
          onCheckedChange={setWifi}
          helperText="Gli aggiornamenti aspettano una rete senza consumo."
        />
        <Caption>
          Una casella è una scelta che verrà inviata col resto di un form, un
          interruttore è una cosa che si accende adesso. Per questo non ha uno
          stato indeterminato: un'impostazione è accesa o spenta, non c'è una
          risposta parziale da dare.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Da che parte"
          subtitle={'side="end" è il default'}
        />
        <Switch label="Interruttore a destra" defaultChecked />
        <Switch side="start" label="Interruttore a sinistra" defaultChecked />
        <Caption>
          A destra è la forma di una riga di impostazioni: il nome a sinistra e
          lo stato dove va l'occhio a controllarlo. Dentro un form, prima
          dell'etichetta si legge meglio, e per questo è una prop e non una
          regola.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Misure" subtitle="34 / 42 / 52 di traccia" />
        <Switch size="sm" label="Piccolo" defaultChecked />
        <Switch size="md" label="Medio" defaultChecked />
        <Switch size="lg" label="Grande" defaultChecked />
        <Caption>
          Non è lo Switch di React Native: quello espone il colore della traccia
          e del pollice e basta, con una dimensione che su iOS non si cambia.
          Metà del componente sarebbe irraggiungibile dal tema e queste tre
          misure non esisterebbero.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Stati" />
        <Switch label="Spento e disabilitato" disabled />
        <Switch label="Acceso e disabilitato" disabled defaultChecked />
        <Switch
          label="Non valido"
          error
          helperText="Serve il consenso per proseguire"
        />
        <Caption>
          Il rosso tinge solo lo stato spento: una volta acceso non c'è più
          niente da correggere, e una traccia rossa sotto una risposta positiva
          è una contraddizione.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Dentro un form"
          subtitle="Stesso booleano della Checkbox"
        />
        <DashFormProvider>
          <Fields onSubmit={setPayload} />
        </DashFormProvider>
        {payload ? <Payload value={payload} /> : null}
        <Caption>
          Anche qui un interruttore mai toccato arriva come false e non come
          chiave mancante: spento è una risposta, non un'assenza.
        </Caption>
      </Card>
    </>
  );
}
