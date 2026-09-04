import { useState } from 'react';
import { View } from 'react-native';
import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Button, TextField, Typography } from '@dashforge/rn';
import { Card, Caption, Label, Row } from '../ui';

const POLICY: RbacPolicy = {
  roles: [
    { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
    { name: 'viewer', permissions: [{ resource: 'profile', action: 'read' }] },
  ],
};

export function TextFieldSection() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('admin');
  const [isBusiness, setIsBusiness] = useState(false);

  return (
    <>
      <Card>
        <Label>Standalone</Label>
        <Caption>
          Senza name e senza form è un input controllato normale.
        </Caption>
        <TextField
          label="Cerca"
          placeholder="Nome o email"
          value={q}
          onChangeText={setQ}
          fullWidth
        />
        <Caption>{q ? `Cerchi: ${q}` : 'Niente ancora'}</Caption>
      </Card>

      <Card>
        <Label>visibleWhen con stato normale</Label>
        <Caption>
          Il predicato non ha bisogno del motore: fuori da un form riceve null e
          la maggior parte delle volte lo ignora, catturando lo stato che hai
          già.
        </Caption>
        <Row>
          <Button
            size="sm"
            color="secondary"
            variant={isBusiness ? 'solid' : 'outline'}
            onPress={() => setIsBusiness(v => !v)}
          >
            Azienda
          </Button>
        </Row>
        <TextField
          label="Partita IVA"
          visibleWhen={() => isBusiness}
          placeholder="Solo per le aziende"
          fullWidth
        />
        <TextField
          label="Codice fiscale"
          visibleWhen={() => !isBusiness}
          placeholder="Solo per i privati"
          fullWidth
        />
      </Card>

      <Card>
        <Label>Misure</Label>
        <TextField label="Piccolo" size="sm" placeholder="sm" fullWidth />
        <TextField label="Medio" size="md" placeholder="md" fullWidth />
        <TextField label="Grande" size="lg" placeholder="lg" fullWidth />
      </Card>

      <Card>
        <Label>Stati</Label>
        <TextField
          label="Obbligatorio"
          required
          placeholder="Con asterisco"
          fullWidth
        />
        <TextField
          label="Con aiuto"
          helperText="Useremo questo indirizzo per le ricevute"
          fullWidth
        />
        <TextField
          label="Non valido"
          error
          helperText="Formato non riconosciuto"
          defaultValue="non-una-email"
          fullWidth
        />
        <TextField
          label="Disabilitato"
          disabled
          defaultValue="Non modificabile"
          fullWidth
        />
      </Card>

      <Card>
        <Label>Tastiere e adornamenti</Label>
        <Caption>
          keyboardType e secureTextEntry arrivano da TextInputProps.
        </Caption>
        <TextField
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          fullWidth
        />
        <TextField label="Password" secureTextEntry fullWidth />
        <TextField
          label="Importo"
          keyboardType="decimal-pad"
          startAdornment={<Typography color="muted">€</Typography>}
          fullWidth
        />
      </Card>

      <Card>
        <Label>Dentro un DashForm</Label>
        <Caption>
          Con un name il campo si registra sul motore, legge il valore da lì e
          la validazione compare solo dopo che l'hai toccato.
        </Caption>
        <DashFormProvider>
          <View style={{ gap: 12 }}>
            <TextField
              name="email"
              label="Email"
              rules={{ required: 'La email è obbligatoria' }}
              keyboardType="email-address"
              autoCapitalize="none"
              fullWidth
            />
            <TextField
              name="note"
              label="Note"
              multiline
              numberOfLines={3}
              fullWidth
            />
          </View>
        </DashFormProvider>
      </Card>

      <RbacProvider policy={POLICY} subject={{ id: 'u', roles: [role] }}>
        <Card>
          <Label>access</Label>
          <Caption>
            Un campo ha uno stato readonly vero, quindi non collassa su
            disabilitato: il valore resta leggibile.
          </Caption>
          <Row>
            {(['admin', 'viewer'] as const).map(r => (
              <Button
                key={r}
                size="sm"
                color="secondary"
                variant={role === r ? 'solid' : 'outline'}
                onPress={() => setRole(r)}
              >
                {r}
              </Button>
            ))}
          </Row>
          <TextField
            label="Nome (readonly se negato)"
            defaultValue="Maria Rossi"
            access={{
              resource: 'profile',
              action: 'edit',
              onUnauthorized: 'readonly',
            }}
            fullWidth
          />
          <TextField
            label="Stipendio (nascosto se negato)"
            defaultValue="50.000"
            access={{ resource: 'salary', action: 'read' }}
            fullWidth
          />
        </Card>
      </RbacProvider>
    </>
  );
}
