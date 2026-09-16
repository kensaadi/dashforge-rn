import { useState } from 'react';
import { DashFormProvider } from '@dashforge/forms';
import { DateField, Divider, SegmentedControl, Typography } from '@dashforge/rn';
import type { SegmentValue } from '@dashforge/rn';
import { Card, Caption } from '../ui';
import { setFakePicker } from '../nativePicker';

/** Today, without reaching past the library's public surface. */
const todayISO = () => new Date().toISOString().slice(0, 10);

export function DateSection() {
  const [when, setWhen] = useState<string | undefined>(undefined);
  const [at, setAt] = useState<string | undefined>('09:30');
  const [source, setSource] = useState<SegmentValue>('none');

  return (
    <>
      <Card>
        <Card.Header
          title="Il picker si inietta, non si importa"
          subtitle="Regola 5.1, e questa è la prima volta che serve davvero"
        />
        <Caption>
          Ogni picker vero è un modulo nativo, quindi la libreria dichiara
          l'interfaccia e l'app fornisce l'implementazione. Con un datePicker
          sul provider questo apre quello della piattaforma, che è il bucket
          tre rispettato: un date picker è una superficie che uno riconosce
          come del proprio telefono.
        </Caption>
        <Caption>
          Senza, ripiega sul calendario che disegniamo noi su calendar-core, e
          lo dice in sviluppo. È l'unico punto in cui questa libreria disegna
          una superficie di sistema, e la ragione sta nella regola stessa: un
          adapter deve degradare verso qualcosa, e sotto "il picker della
          piattaforma" l'unica cosa che non sia "non rispondibile" è un
          calendario.
        </Caption>
        <SegmentedControl
          label="Cosa c'è sul provider"
          options={[
            { value: 'none', label: 'Nessun picker' },
            { value: 'fake', label: 'Un picker finto' },
          ]}
          value={source}
          onValueChange={next => {
            setSource(next);
            setFakePicker(next === 'fake');
          }}
        />
        <Caption>
          Il finto risponde subito con dopodomani, senza aprire niente: serve a
          far vedere che il campo delega e non disegna. In un'app vera qui ci
          va @react-native-community/datetimepicker, che resta fuori dalle
          dipendenze della libreria.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Una data" />
        <DateField
          label="Quando"
          placeholder="Scegli un giorno"
          value={when}
          onValueChange={setWhen}
          min={todayISO()}
          helperText="Da oggi in avanti."
          fullWidth
        />
        <Typography color="muted">
          {when ? `Nel payload: "${when}"` : 'Niente ancora.'}
        </Typography>
        <Caption>
          Risponde con una stringa, mai con un Date: un Date è un istante nel
          tempo, un compleanno è lo stesso giorno in ogni fuso, e farlo passare
          per l'altro è come diventa il giorno prima per tutti a est del
          meridiano.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Un orario" />
        <DateField
          mode="time"
          label="A che ora"
          value={at}
          onValueChange={setAt}
          min="08:00"
          max="20:00"
          minuteStep={30}
          fullWidth
        />
        <Typography color="muted">
          {at ? `Nel payload: "${at}"` : 'Niente ancora.'}
        </Typography>
      </Card>

      <Card>
        <Card.Header title="Dentro una form" />
        <DashFormProvider>
          <DateField name="nascita" label="Data di nascita" required fullWidth />
          <Divider spacing="sm" />
          <DateField
            name="appuntamento"
            label="Appuntamento"
            mode="time"
            minuteStep={15}
            fullWidth
          />
          <Caption>
            Stesso ponte di ogni altro campo: si registra, legge dal motore e
            scrive la stringa ISO nel payload.
          </Caption>
        </DashFormProvider>
      </Card>

      <Card>
        <Card.Header title="Spento" />
        <DateField label="Non modificabile" value="2026-03-14" disabled fullWidth />
      </Card>
    </>
  );
}
