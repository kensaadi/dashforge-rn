import { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  BottomSheet,
  Button,
  Card,
  RadioGroup,
  Stack,
  Typography,
} from '@dashforge/rn';
import type { BottomSheetRadius, RadioValue } from '@dashforge/rn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Caption } from '../ui';

const SORTS = [
  { value: 'relevance', label: 'Rilevanza' },
  { value: 'price-asc', label: 'Prezzo crescente' },
  { value: 'price-desc', label: 'Prezzo decrescente' },
  { value: 'newest', label: 'Più recenti' },
];

const RADII: BottomSheetRadius[] = ['none', 'sm', 'md', 'lg', 'xl', 'xxl'];

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

export function BottomSheetSection() {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<RadioValue>('relevance');
  const [region, setRegion] = useState<RadioValue | undefined>(undefined);

  const [short, setShort] = useState(false);
  const [long, setLong] = useState(false);
  const [locked, setLocked] = useState(false);
  const [anywhere, setAnywhere] = useState(false);
  const [radius, setRadius] = useState<BottomSheetRadius>('none');
  const [rounded, setRounded] = useState(false);
  const [sized, setSized] = useState(false);
  const [snap, setSnap] = useState(0);

  return (
    <>
      <Card>
        <Card.Header
          title="La parte difficile è l'arbitraggio"
          subtitle="Non l'animazione"
        />
        <Caption>
          React Native dà il gesto alla prima vista che lo reclama e non lo
          restituisce a metà trascinamento. Un foglio che si prende ogni swipe
          verso il basso ha rotto ogni lista scrollabile dentro di sé; uno che
          non se ne prende nessuno non si può trascinare. Non esiste una
          disposizione giusta per entrambi.
        </Caption>
        <Caption>
          Quindi la scelta ha un nome invece di essere indovinata. Il default è
          dragFrom="handle": si trascina la maniglia e la striscia attorno, e
          tutto quello che sta sotto tiene i suoi gesti.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Corto" subtitle="Il caso normale: poche scelte" />
        <Button onPress={() => setShort(true)}>Ordina per</Button>
        <Caption>{`Attuale: ${
          SORTS.find(s => s.value === sort)?.label
        }`}</Caption>
      </Card>

      <BottomSheet
        open={short}
        onClose={() => setShort(false)}
        label="Ordina per"
        bottomInset={insets.bottom}
      >
        <Card.Header title="Ordina per" />
        <RadioGroup
          value={sort}
          onValueChange={v => {
            setSort(v);
            setShort(false);
          }}
        >
          {SORTS.map(s => (
            <RadioGroup.Option key={s.value} value={s.value} label={s.label} />
          ))}
        </RadioGroup>
      </BottomSheet>

      <Card>
        <Card.Header
          title="Lungo"
          subtitle="Una lista che scorre dentro il foglio"
        />
        <Button
          variant="outline"
          color="secondary"
          onPress={() => setLong(true)}
        >
          Scegli una regione
        </Button>
        <Caption>{`Attuale: ${region ?? 'nessuna'}`}</Caption>
        <Caption>
          Trascina dalla maniglia e il foglio scende; trascina dalla lista e la
          lista scorre. È la ragione per cui la maniglia è il bersaglio di
          default: qui dentro c'è uno ScrollView e i due gesti non si contendono
          niente.
        </Caption>
      </Card>

      <BottomSheet
        open={long}
        onClose={() => setLong(false)}
        label="Dove abiti"
        bottomInset={insets.bottom}
      >
        <Card.Header title="Dove abiti" />
        <ScrollView style={{ maxHeight: 380 }}>
          <RadioGroup
            value={region}
            onValueChange={v => {
              setRegion(v);
              setLong(false);
            }}
          >
            {REGIONS.map(r => (
              <RadioGroup.Option key={r} value={r} label={r} />
            ))}
          </RadioGroup>
        </ScrollView>
      </BottomSheet>

      <Card>
        <Card.Header title="Gli altri due comportamenti" />
        <Stack direction="row" gap="inline">
          <Button
            size="sm"
            variant="outline"
            color="secondary"
            onPress={() => setAnywhere(true)}
          >
            Trascina ovunque
          </Button>
          <Button
            size="sm"
            variant="outline"
            color="secondary"
            onPress={() => setLocked(true)}
          >
            Non chiudibile
          </Button>
        </Stack>
        <Caption>
          Il primo rende tutto il foglio un bersaglio, che va bene finché dentro
          non c'è niente che scorra. Il secondo si muove sotto il dito e torna
          su: rifiutarsi di muoversi sarebbe fingere di non essere un foglio.
        </Caption>
      </Card>

      <BottomSheet
        open={anywhere}
        onClose={() => setAnywhere(false)}
        dragFrom="anywhere"
        label="Trascina da qualsiasi punto"
        bottomInset={insets.bottom}
      >
        <Card.Header
          title="Trascina da qualsiasi punto"
          subtitle="Nessuno scroll qui dentro, quindi non c'è niente da contendere."
        />
        <Typography color="muted">
          Prova a spingere verso il basso partendo da queste parole. Il pulsante
          resta un pulsante: il foglio prende il gesto solo dove non c'è altro.
        </Typography>
        <Button variant="outline" onPress={() => setAnywhere(false)}>
          Chiudi
        </Button>
      </BottomSheet>

      <Card>
        <Card.Header
          title="Due altezze"
          subtitle="snapPoints, e il foglio si ridimensiona"
        />
        <Button
          size="sm"
          variant="outline"
          color="secondary"
          onPress={() => setSized(true)}
        >
          Apri a due terzi
        </Button>
        <Caption>
          {`Trascina la maniglia verso l'alto e il foglio sale al secondo passo; trascinala in giù e torna al primo, oppure se ne va. Passo attuale: ${snap === 0 ? '0.45' : '0.92'}.`}
        </Caption>
        <Caption>
          È una traslazione, non un'altezza animata: il foglio è disposto una
          volta sola alla misura più alta e il passo più basso ne fa scorrere il
          resto sotto il bordo. Per questo il contenuto è ancorato in alto e un
          Card.Footer qui dentro non si vedrebbe al passo corto.
        </Caption>
      </Card>

      <BottomSheet
        open={sized}
        onClose={() => setSized(false)}
        snapPoints={[0.45, 0.92]}
        onSnapChange={setSnap}
        radius="lg"
        label="Due altezze"
        bottomInset={insets.bottom}
      >
        <Card.Header
          title="Trascina la maniglia"
          subtitle="Su per allargare, giù per stringere o chiudere."
        />
        <ScrollView>
          <Stack gap="stack">
            {REGIONS.map(r => (
              <Typography key={r}>{r}</Typography>
            ))}
          </Stack>
        </ScrollView>
      </BottomSheet>

      <Card>
        <Card.Header
          title="I due angoli in alto"
          subtitle="Gli altri due sono contro il bordo dello schermo"
        />
        <Stack direction="row" gap="inline" wrap>
          {RADII.map(step => (
            <Button
              key={step}
              size="sm"
              variant={step === radius ? 'solid' : 'outline'}
              color="secondary"
              onPress={() => {
                setRadius(step);
                setRounded(true);
              }}
            >
              {step}
            </Button>
          ))}
        </Stack>
        <Caption>
          Quadrato di default: il foglio è già separato dalla pagina dallo scrim
          e dal suo fondo, quindi l'arrotondamento è decorazione e la decorazione
          la sceglie chi usa il componente. Manca full: su una superficie larga
          e bassa diventa una cupola che esce da sotto il testo, quindi il tipo
          non lo offre.
        </Caption>
      </Card>

      <BottomSheet
        open={rounded}
        onClose={() => setRounded(false)}
        radius={radius}
        label={`Raggio ${radius}`}
        bottomInset={insets.bottom}
      >
        <Card.Header
          title={`radius="${radius}"`}
          subtitle="Solo in alto a sinistra e a destra."
        />
        <Typography color="muted">
          Trascina dalla maniglia per chiuderlo, poi prova un altro passo.
        </Typography>
      </BottomSheet>

      <BottomSheet
        open={locked}
        onClose={() => setLocked(false)}
        dismissible={false}
        label="Serve una risposta"
        bottomInset={insets.bottom}
      >
        <Card.Header
          title="Serve una risposta"
          subtitle="Lo scrim e il trascinamento non lo chiudono."
        />
        <Card.Footer>
          <Button size="sm" onPress={() => setLocked(false)}>
            Ho capito
          </Button>
        </Card.Footer>
      </BottomSheet>
    </>
  );
}
