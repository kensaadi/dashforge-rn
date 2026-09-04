import { useState } from 'react';
import { Button, Typography } from '@dashforge/rn';
import { Card, Caption, Label, Row } from '../ui';

export function VisibleWhenSection() {
  const [isBusiness, setIsBusiness] = useState(false);
  const [hasVat, setHasVat] = useState(false);

  return (
    <>
      <Card>
        <Label>Stato</Label>
        <Caption>
          Senza un DashForm non c'è motore e il predicato riceve lo stato
          esterno che hai catturato nella chiusura. Dentro un form si rivaluta
          da solo.
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
          <Button
            size="sm"
            color="secondary"
            variant={hasVat ? 'solid' : 'outline'}
            onPress={() => setHasVat(v => !v)}
          >
            Partita IVA inserita
          </Button>
        </Row>
      </Card>

      <Card>
        <Label>Conseguenze</Label>
        <Typography visibleWhen={() => !isBusiness} color="muted">
          Nessun dato fiscale richiesto per un privato.
        </Typography>
        <Button visibleWhen={() => isBusiness} fullWidth>
          Inserisci partita IVA
        </Button>
        <Button
          visibleWhen={() => isBusiness && hasVat}
          color="success"
          fullWidth
        >
          Verifica in Agenzia Entrate
        </Button>
        <Typography
          visibleWhen={() => isBusiness && !hasVat}
          color="warning"
          variant="bodySmall"
        >
          La partita IVA è obbligatoria per proseguire.
        </Typography>
      </Card>
    </>
  );
}
