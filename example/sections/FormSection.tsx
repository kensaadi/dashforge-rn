import { useState } from 'react';
import { View } from 'react-native';
import {
  DashFormProvider,
  useDashFormContext,
  useDashFormState,
} from '@dashforge/forms';
import { Button, TextField, Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Card, Caption, Label, Row } from '../ui';

/**
 * The part that matters when wiring a screen to a backend: what comes
 * out of the form, and when.
 *
 * On React Native there is no submit event, because there is no `<form>`
 * to fire one. `handleSubmit` is called from a button's `onPress`
 * instead, which is why `DashFormProvider` is enough and the `DashForm`
 * wrapper buys nothing here.
 */
function Fields({ onSubmit }: { onSubmit: (values: unknown) => void }) {
  const { rhf } = useDashFormContext();
  // Read in the component that needs them, never off `rhf.formState` in
  // a child. RHF's formState is a Proxy that schedules a render on
  // whoever subscribed, so reading it here without `useFormState` gives
  // values that never update: that is BUG 4, and `useDashFormState` is
  // its fix.
  const { isDirty, isSubmitting, isValid } = useDashFormState();

  return (
    <View style={{ gap: 12 }}>
      <TextField
        name="email"
        label="Email"
        required
        rules={{
          required: 'La email è obbligatoria',
          pattern: { value: /.+@.+\..+/, message: 'Formato non riconosciuto' },
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="tu@esempio.it"
        fullWidth
      />
      <TextField
        name="company"
        label="Ragione sociale"
        required
        rules={{ required: 'Serve la ragione sociale' }}
        placeholder="Acme S.r.l."
        fullWidth
      />
      <TextField
        name="vat"
        label="Partita IVA"
        rules={{ minLength: { value: 11, message: 'Almeno 11 caratteri' } }}
        keyboardType="number-pad"
        placeholder="12345678901"
        fullWidth
      />
      <TextField
        name="note"
        label="Note"
        multiline
        numberOfLines={3}
        fullWidth
      />

      <Row>
        <Button
          // Wrapped rather than passed straight through: `handleSubmit`
          // returns a handler expecting a DOM-shaped event, and a press
          // on React Native hands over a gesture one. The wrapper is
          // where that mismatch stops.
          onPress={() => void rhf.handleSubmit(onSubmit)()}
          loading={isSubmitting}
          disabled={!isDirty}
        >
          Invia
        </Button>
        <Button variant="outline" color="secondary" onPress={() => rhf.reset()}>
          Azzera
        </Button>
      </Row>
      <Caption>
        {`isDirty ${String(isDirty)} · isValid ${String(isValid)} · isSubmitting ${String(isSubmitting)}`}
      </Caption>
    </View>
  );
}

export function FormSection() {
  const s = useTheme().semantic;
  const [payload, setPayload] = useState<unknown>(null);
  const [rejected, setRejected] = useState(0);

  return (
    <>
      <Card>
        <Label>Un form vero</Label>
        <Caption>
          Il submit passa dalla validazione: finché non è valida, onSubmit non
          viene chiamata affatto e gli errori compaiono sotto i campi.
        </Caption>
        <DashFormProvider
          // Pre-filled, which is also the commoner real case: a payload
          // demo is usually an edit screen, not a blank one.
          defaultValues={{
            email: 'maria@acme.it',
            company: 'Acme S.r.l.',
            vat: '',
            note: '',
          }}
          mode="onTouched"
        >
          <Fields
            onSubmit={values => {
              setPayload(values);
              setRejected(0);
            }}
          />
        </DashFormProvider>
      </Card>

      <Card>
        <Label>Payload</Label>
        <Caption>Quello che manderesti al backend, esattamente com'è.</Caption>
        <View
          style={{
            backgroundColor: s.surface.inverse,
            borderRadius: s.radius.control,
            padding: s.space.inset,
          }}
        >
          <Typography variant="mono" sx={{ color: s.text.inverse }}>
            {payload
              ? JSON.stringify(payload, null, 2)
              : '// premi Invia con un form valido'}
          </Typography>
        </View>
        {rejected > 0 ? (
          <Typography variant="bodySmall" color="danger">
            Submit rifiutato dalla validazione
          </Typography>
        ) : null}
      </Card>

      <Card>
        <Label>Perché non c'è un onSubmit sul contenitore</Label>
        <Caption>
          Su React Native non esiste l'evento submit di un form, perché non c'è
          un form. handleSubmit si chiama dal bottone, e DashFormProvider basta:
          il wrapper DashForm esiste solo per la submit nativa del browser.
        </Caption>
      </Card>
    </>
  );
}
