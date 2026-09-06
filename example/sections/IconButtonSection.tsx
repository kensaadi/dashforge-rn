import { useState } from 'react';
import { Card, IconButton, Stack, Typography } from '@dashforge/rn';
import { Caption } from '../ui';
import { ChevronRight, Close, More, Plus, Search, Trash } from '../icons';

const COLORS = [
  'primary',
  'secondary',
  'danger',
  'success',
  'warning',
] as const;

export function IconButtonSection() {
  const [saving, setSaving] = useState(false);

  return (
    <>
      <Card>
        <Card.Header
          title="L'etichetta non è opzionale"
          subtitle="Un'icona è l'affordance, non il nome"
        />
        <Caption>
          Un bottone con un'etichetta si annuncia da solo, uno con solo un glifo
          non annuncia niente e chi usa VoiceOver sente "bottone". È il difetto
          di accessibilità più comune di una barra di strumenti, ed è invisibile
          a chiunque non ne sia colpito. Senza accessibilityLabel questo
          componente avvisa in sviluppo.
        </Caption>
        <Stack direction="row" gap="inline">
          <IconButton icon={Search} accessibilityLabel="Cerca" />
          <IconButton icon={Plus} accessibilityLabel="Aggiungi" />
          <IconButton
            icon={Trash}
            accessibilityLabel="Elimina"
            color="danger"
          />
          <IconButton icon={More} accessibilityLabel="Altre azioni" />
          <IconButton icon={Close} accessibilityLabel="Chiudi" />
        </Stack>
        <Caption>
          Le icone di questo playground sono disegnate con delle View. Non è
          quello che farebbe un'app, che installerebbe un set: sono qui per
          mostrare qual è il contratto, cioè un componente che accetta size e
          color e nient'altro. La libreria non dipende da nessun pacchetto di
          icone.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Varianti"
          subtitle="ghost è il default, non solid"
        />
        {(['ghost', 'outline', 'solid'] as const).map(variant => (
          <Stack key={variant} gap="inline">
            <Typography variant="label">{variant}</Typography>
            <Stack direction="row" gap="inline">
              {COLORS.map(color => (
                <IconButton
                  key={color}
                  icon={Plus}
                  variant={variant}
                  color={color}
                  accessibilityLabel={`Aggiungi ${color}`}
                />
              ))}
            </Stack>
          </Stack>
        ))}
        <Caption>
          Un bottone icona di solito è uno di tanti in una barra, e cinque
          cerchi pieni in fila sono un muro. Per questo qui il default è ghost
          dove sul Button è solid.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Misure e raggio" />
        <Stack direction="row" gap="inline" align="center">
          {(['sm', 'md', 'lg'] as const).map(size => (
            <IconButton
              key={size}
              icon={Search}
              size={size}
              variant="outline"
              accessibilityLabel={`Cerca ${size}`}
            />
          ))}
        </Stack>
        <Stack direction="row" gap="inline" align="center">
          {(['sm', 'md', 'lg'] as const).map(size => (
            <IconButton
              key={size}
              icon={Plus}
              size={size}
              radius="full"
              variant="solid"
              color="primary"
              accessibilityLabel={`Nuovo ${size}`}
            />
          ))}
        </Stack>
        <Caption>
          La scatola è quadrata, così il glifo sta in mezzo a una forma e non in
          mezzo a un rettangolo. È piccola di proposito e il bersaglio no:
          hitSlop porta anche sm oltre i 44pt senza farla crescere.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="In attesa e non disponibile"
          subtitle="Due messaggi diversi"
        />
        <Stack direction="row" gap="inline" align="center">
          <IconButton
            icon={Plus}
            variant="solid"
            color="primary"
            loading={saving}
            accessibilityLabel="Salva"
            onPress={() => {
              setSaving(true);
              setTimeout(() => setSaving(false), 1600);
            }}
          />
          <IconButton
            icon={Plus}
            variant="solid"
            color="primary"
            disabled
            accessibilityLabel="Non disponibile"
          />
          <Typography variant="caption" color="muted">
            Toccane uno
          </Typography>
        </Stack>
        <Caption>
          Il primo tiene il colore mentre lavora, perché attenuarlo direbbe "non
          puoi", che è un messaggio diverso da "aspetta". Il secondo è attenuato
          davvero.
        </Caption>
      </Card>

      <Card padding="none">
        <Stack gap="none" divider sx={{ paddingHorizontal: 16 }}>
          {['Profilo', 'Notifiche', 'Privacy'].map(row => (
            <Stack
              key={row}
              direction="row"
              justify="between"
              gap="inline"
              sx={{ paddingVertical: 6 }}
            >
              <Typography>{row}</Typography>
              <IconButton
                icon={ChevronRight}
                size="sm"
                accessibilityLabel={`Apri ${row}`}
              />
            </Stack>
          ))}
        </Stack>
      </Card>
    </>
  );
}
