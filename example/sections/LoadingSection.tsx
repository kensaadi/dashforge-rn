import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Divider,
  List,
  ListItem,
  Skeleton,
  Spinner,
  Stack,
  Typography,
} from '@dashforge/rn';
import { Card, Caption, Row } from '../ui';

const PEOPLE = [
  { name: 'Kenjy Saadi', role: 'Amministratore', unread: 3 },
  { name: 'Ada Byron King', role: 'Sviluppatrice', unread: 0 },
  { name: 'Grace Hopper', role: 'Ospite', unread: 142 },
];

function RowSkeleton() {
  return (
    <Stack direction="row" align="center" gap="stack" sx={{ paddingVertical: 10 }}>
      <Skeleton width={32} height={32} radius="full" />
      <Stack gap="inline" sx={{ flex: 1 }}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </Stack>
    </Stack>
  );
}

export function LoadingSection() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <Card>
        <Card.Header
          title="Spinner"
          subtitle="Disegnato qui, non delegato alla piattaforma"
        />
        <Caption>
          I tre bucket di ARCHITECTURE.md lo decidono: uno spinner è aspetto, e
          l'aspetto è nostro su entrambe le piattaforme. Il bucket tre sono i
          date picker, gli action sheet e i share sheet, cioè le superfici che
          l'utente riconosce come del sistema operativo. Nessuno ha mai
          riconosciuto uno spinner.
        </Caption>
        <Caption>
          Sotto c'è anche un motivo duro: ActivityIndicator accetta small o
          large e ignora un numero su iOS, quindi lo stesso md sarebbe una
          misura su Android e un'altra su iOS.
        </Caption>
        <Row gap="stack">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </Row>
        <Divider spacing="sm" />
        <Row gap="stack">
          <Spinner color="primary" />
          <Spinner color="secondary" />
          <Spinner color="success" />
          <Spinner color="warning" />
          <Spinner color="danger" />
        </Row>
        <Divider spacing="sm" />
        <Caption>
          Dentro un Button è lo stesso componente: un'app ha uno spinner solo.
        </Caption>
        <Row gap="inline">
          <Button loading>Salvo</Button>
          <Button loading variant="outline" color="secondary">
            Salvo
          </Button>
        </Row>
      </Card>

      <Card>
        <Card.Header
          title="Skeleton"
          subtitle="Pulsa, non luccica"
        />
        <Caption>
          Il luccichio è un gradiente che attraversa il blocco, e questo package
          non importa nessuna capacità nativa, gradienti compresi. Il battito è
          opacità: non serve niente e gira sul driver nativo. Sotto Riduci
          Movimento si ferma, al contrario dello Spinner, perché una schermata
          di caricamento è un campo di blocchi che respirano tutti insieme.
        </Caption>
        <Skeleton.Text />
        <Divider spacing="sm" />
        <Row gap="stack">
          <Skeleton width={40} height={40} radius="full" />
          <Skeleton width={56} height={56} radius="md" />
          <Skeleton width={80} height={24} radius="full" />
        </Row>
      </Card>

      <Card>
        <Card.Header
          title="La stessa lista, nei due stati"
          subtitle="È il motivo per cui sono nati adesso"
        />
        <Button
          size="sm"
          variant="outline"
          color="secondary"
          onPress={() => setLoading(v => !v)}
        >
          {loading ? 'Mostra i dati' : 'Torna a caricare'}
        </Button>
      </Card>

      <Card padding="none">
        {loading ? (
          <Stack sx={{ paddingHorizontal: 16 }}>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </Stack>
        ) : (
          <List divider="inset">
            {PEOPLE.map(p => (
              <ListItem
                key={p.name}
                leading={<Avatar name={p.name} size="sm" />}
                title={p.name}
                subtitle={p.role}
                trailing={
                  p.unread > 0 ? (
                    <Badge
                      count={p.unread}
                      color="danger"
                      accessibilityLabel={`${p.unread} messaggi non letti`}
                    />
                  ) : undefined
                }
              />
            ))}
          </List>
        )}
      </Card>

      <Card>
        <Typography color="muted">
          Lo scheletro ha la forma di quello che sta aspettando: stesso avatar,
          stesse due righe di testo, stessa aria. Se le due schermate non
          coincidono, il passaggio dallo scheletro ai dati fa saltare la pagina.
        </Typography>
      </Card>
    </>
  );
}
