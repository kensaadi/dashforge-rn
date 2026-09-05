import { Button, Card, Stack, Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Caption } from '../ui';

/** A block with an outline, so the stack's own geometry is visible. */
function Cell({ children }: { children: string }) {
  const s = useTheme().semantic;
  return (
    <Typography
      variant="caption"
      align="center"
      sx={{
        backgroundColor: s.fill.subtle,
        color: s.text.primary,
        borderRadius: s.radius.control,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      {children}
    </Typography>
  );
}

function SettingRow({ title, value }: { title: string; value: string }) {
  return (
    <Stack
      direction="row"
      justify="between"
      gap="inline"
      sx={{ paddingVertical: 10 }}
    >
      <Typography>{title}</Typography>
      <Typography color="muted">{value}</Typography>
    </Stack>
  );
}

export function StackSection() {
  return (
    <>
      <Card>
        <Card.Header
          title="La cosa sottile che scrivono tutti"
          subtitle="Il playground se l'era costruita da solo"
        />
        <Caption>
          Quello che aggiunge rispetto a una View con un flexDirection: lo
          spazio viene dalla scala e ha un nome, la linea di separazione sa
          quale token usare, e la direzione si legge al punto di chiamata. La
          Row di questo playground adesso è due righe sopra questo.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Lo spazio ha un nome" subtitle="Non un numero" />
        <Stack gap="section">
          {(['none', 'inline', 'stack', 'inset', 'section'] as const).map(
            gap => (
              <Stack key={gap} gap="inline">
                <Typography variant="label">{gap}</Typography>
                <Stack direction="row" gap={gap}>
                  <Cell>uno</Cell>
                  <Cell>due</Cell>
                  <Cell>tre</Cell>
                </Stack>
              </Stack>
            ),
          )}
        </Stack>
        <Caption>
          inline fra cose su una riga, stack fra cose impilate, inset quanto la
          spaziatura di una scheda, section fra parti di una schermata. Un
          numero si accetta per quello che la scala non sa dire, ed è lo stesso
          tipo di uscita di sx: funziona, e vuol dire che sei fuori dalla scala.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="L'asse trasversale"
          subtitle="Il default dipende dalla direzione, di proposito"
        />
        <Typography variant="label">Colonna: si allarga</Typography>
        <Stack gap="inline">
          <Cell>occupa tutta la larghezza</Cell>
          <Cell>anche questa</Cell>
        </Stack>
        <Typography variant="label">Riga: si centra</Typography>
        <Stack direction="row" gap="inline">
          <Cell>corta</Cell>
          <Button size="sm">Un bottone</Button>
          <Cell>anche questa</Cell>
        </Stack>
        <Caption>
          Una colonna si allarga, che è il comportamento di React Native e
          quello che fa riempire la larghezza a una pila di schede. Una riga si
          centra, perché allargando ogni figlio diventerebbe alto quanto il più
          alto, e un bottone accanto a un paragrafo sarebbe alto come il
          paragrafo. Due default diversi perché quello sbagliato dà fastidio in
          due modi diversi.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Distribuzione" subtitle="justify" />
        {(['start', 'center', 'end', 'between', 'around'] as const).map(
          justify => (
            <Stack key={justify} gap="inline">
              <Typography variant="caption" color="muted">
                {justify}
              </Typography>
              <Stack direction="row" justify={justify} gap="inline">
                <Cell>uno</Cell>
                <Cell>due</Cell>
              </Stack>
            </Stack>
          ),
        )}
      </Card>

      <Card padding="none">
        <Stack gap="none" divider sx={{ paddingHorizontal: 16 }}>
          <SettingRow title="Notifiche" value="Attive" />
          <SettingRow title="Lingua" value="Italiano" />
          <SettingRow title="Archiviazione" value="2,4 GB" />
          <SettingRow title="Versione" value="0.0.0" />
        </Stack>
      </Card>

      <Card>
        <Card.Header title="La linea in mezzo" subtitle="divider" />
        <Caption>
          La lista qui sopra. Le linee stanno fra i figli e mai alle estremità,
          e sono interlacciate invece che disegnate dal contenitore, perché un
          confine non è una proprietà della scatola: solo i figli sanno dove
          sono i confini.
        </Caption>
        <Stack direction="row" divider gap="inset">
          <Cell>in riga</Cell>
          <Cell>la linea</Cell>
          <Cell>è verticale</Cell>
        </Stack>
        <Stack
          direction="row"
          divider={<Typography color="muted">oppure</Typography>}
          gap="inline"
        >
          <Button size="sm" variant="outline" color="secondary">
            Accedi
          </Button>
          <Button size="sm" variant="outline" color="secondary">
            Registrati
          </Button>
        </Stack>
        <Caption>
          Un nodo al posto di true sostituisce la riga, per i casi in cui il
          separatore è contenuto e non un tratto.
        </Caption>
      </Card>
    </>
  );
}
