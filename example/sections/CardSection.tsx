import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Typography } from '@dashforge/rn';
import { Caption, Label, Row } from '../ui';

/** Un'immagine remota vera, per mostrare che `source` accetta un uri. */
const REMOTE = 'https://picsum.photos/id/1043/800/450';

/**
 * The component the playground had to invent twice before it existed:
 * once as `Card` in `ui.tsx`, once as `Panel` inside the Surface
 * section. Both are now this.
 */
export function CardSection() {
  const [tapped, setTapped] = useState(0);

  return (
    <>
      <Card
        padding="none"
        onPress={() => setTapped(n => n + 1)}
        accessibilityLabel="Solo oggi, sconto del 30% su tutto il catalogo"
        accessibilityHint="Apre le offerte"
      >
        <Card.Media
          source={require('../assets/promo.png')}
          aspectRatio={1000 / 420}
          flush="all"
        />
      </Card>

      <Card>
        <Card.Header
          title="La scheda che è solo un'immagine"
          subtitle={'padding="none" + flush="all" + onPress'}
        />
        <Caption>
          {`Il banner qui sopra. Niente spaziatura, la fascia tocca tutti e quattro i bordi, quindi tutti e quattro gli angoli arrotondati: non c'è niente sotto per cui tenerne due quadri. Toccato ${tapped} volte.`}
        </Caption>
        <Caption>
          Qui l'etichetta di accessibilità non è un dettaglio: il messaggio sta
          nei pixel, quindi senza di essa la scheda è un bottone che non
          annuncia niente. Nelle altre schede l'immagine è decorazione accanto a
          un titolo che la nomina già ed è giusto saltarla, qui è l'unico
          contenuto che c'è.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Varianti"
          subtitle="Un bordo, un'ombra, o un fondo diverso. Mai due insieme."
        />
        <Card variant="outlined">
          <Label>outlined</Label>
          <Caption>
            Il default. Un bordo si legge su qualsiasi fondo e non compete con
            il contenuto.
          </Caption>
        </Card>
        <Card variant="elevated">
          <Label>elevated</Label>
          <Caption>
            L'eccezione, per una scheda che deve stare sopra la pagina. In scuro
            l'ombra si legge poco, per questo lì porta più opacità.
          </Caption>
        </Card>
        <Card variant="filled">
          <Label>filled</Label>
          <Caption>
            Sta dentro la pagina invece che sopra: un raggruppamento, non un
            oggetto separato.
          </Caption>
        </Card>
      </Card>

      <Card>
        <Card.Header
          title="Testata"
          subtitle="Titolo, sottotitolo e un'azione in coda"
          action={
            <Button size="sm" variant="ghost" onPress={() => setTapped(0)}>
              Azzera
            </Button>
          }
        />
        <Caption>
          L'azione resta in alto invece che centrarsi, così non scivola quando
          il titolo va a capo. Prova a girare il telefono.
        </Caption>
        <Card variant="filled">
          <Card.Header
            title="Un titolo abbastanza lungo da andare a capo su due righe"
            subtitle="Il blocco di testo prende la larghezza, l'azione no"
            action={
              <Button size="sm" color="secondary">
                Apri
              </Button>
            }
          />
        </Card>
      </Card>

      <Card>
        <Card.Header title="Spaziatura" subtitle="none, sm, md, lg" />
        <Row>
          {(['none', 'sm', 'md', 'lg'] as const).map(p => (
            <Card key={p} variant="filled" padding={p}>
              <Typography variant="caption">{p}</Typography>
            </Card>
          ))}
        </Row>
        <Caption>
          `none` serve alla scheda il cui contenuto arriva ai bordi: un'immagine
          a tutta larghezza, o una lista che disegna le sue righe.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Premibile"
          subtitle="Tutta la scheda diventa un bersaglio solo"
        />
        <Card
          variant="elevated"
          onPress={() => setTapped(n => n + 1)}
          accessibilityLabel="Apri la fattura 2024-118"
        >
          <Card.Header title="Fattura 2024-118" subtitle="Scade il 12 marzo" />
          <Typography color="muted" variant="caption">
            Toccata {tapped} volte
          </Typography>
        </Card>
        <Card variant="outlined" onPress={() => {}} disabled>
          <Card.Header title="Non disponibile" subtitle="Inerte e attenuata" />
        </Card>
        <Caption>
          Con onPress diventa un bottone anche per chi usa VoiceOver, quindi
          vuole una etichetta se il contenuto non dice già dove porta.
        </Caption>
      </Card>

      <Card>
        <Card.Header
          title="Tono"
          subtitle="Il significato come ruolo, non come colore"
        />
        <Caption>
          Tinge il fondo, ricolora il bordo e porta con sé il testo, coerente
          nei due modi. È la risposta a "questa scheda è un avviso". Non è la
          risposta a "questa scheda è #FF5722": quello è sx, e devi sapere che
          ti mette fuori dal tema.
        </Caption>
        {(['success', 'warning', 'danger', 'info'] as const).map(tone => (
          <Card key={tone} tone={tone}>
            <Card.Header
              title={tone}
              subtitle="Il bordo e il testo seguono il fondo"
            />
          </Card>
        ))}
        <Caption>
          Il tono decide i colori, la variante decide se c'è un bordo o
          un'ombra. Sono ortogonali.
        </Caption>
        <Card tone="warning" variant="filled">
          <Card.Header title="warning + filled" subtitle="Tinta, senza bordo" />
        </Card>
        <Card tone="info" variant="elevated" onPress={() => {}}>
          <Card.Header
            title="info + elevated, premibile"
            subtitle="Anche il tono si muove sotto il dito"
          />
        </Card>
      </Card>

      <Card>
        <Card.Header
          title="Copertina"
          subtitle="L'immagine sotto, le parole sopra"
        />
        <Caption>
          Il compromesso opposto alla fascia, ed è per questo che è un
          componente a parte. Una fascia mette il testo sul suo fondo e non deve
          promettere niente. Una copertina lo mette su una fotografia, e allora
          deve.
        </Caption>

        <Card padding="none" onPress={() => setTapped(n => n + 1)}>
          <Card.Cover
            source={require('../assets/landscape.png')}
            minHeight={200}
            accessibilityLabel="Colline al tramonto"
          >
            <Card.Header
              title="Dove finisce la luce"
              subtitle="Reportage · 8 minuti"
            />
          </Card.Cover>
        </Card>

        <Caption>
          Due cose non sono del chiamante. Il velo fra immagine e testo è del
          componente, perché il contrasto contro dei pixel che arrivano da un
          CDN non si misura né qui né lì. E il testo sopra smette di seguire
          chiaro e scuro: una fotografia non si inverte col tema, quindi non
          possono farlo nemmeno le parole che ci stanno sopra. Prova a girare il
          tema e guarda che resta bianco.
        </Caption>

        <Card padding="none">
          <Card.Cover
            source={require('../assets/abstract.png')}
            minHeight={160}
            align="top"
            scrim={0.35}
          >
            <Card.Header
              title="Velo più leggero, in alto"
              subtitle={'scrim={0.35}, align="top"'}
            />
          </Card.Cover>
        </Card>

        <Caption>
          Il velo è piatto e non sfumato: una sfumatura vorrebbe una dipendenza
          e questa libreria ne ha tre. Piatto è meno bello e sempre corretto,
          che è il compromesso giusto per la cosa che decide se le parole si
          leggono. Sotto 0.3 avvisa in sviluppo, perché lì smette di poter
          promettere qualcosa.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Le CTA" subtitle="In fondo, non in testata" />
        <Caption>
          `action` sulla testata è lo slot accanto al titolo: un prezzo, un
          "vedi tutti", un menu. Quello che la scheda ti sta chiedendo di fare
          sta in Card.Footer, in fondo, dove lo trova chi ha letto prima.
        </Caption>

        <Card variant="filled">
          <Card.Header
            title="Due azioni"
            subtitle={'align="end", il default'}
          />
          <Card.Footer divider>
            <Button size="sm" variant="ghost" color="secondary">
              Annulla
            </Button>
            <Button size="sm">Conferma</Button>
          </Card.Footer>
        </Card>

        <Card variant="filled">
          <Card.Header
            title="Una sola azione"
            subtitle={'align="stack" + fullWidth'}
          />
          <Card.Footer align="stack" divider>
            <Button fullWidth onPress={() => setTapped(n => n + 1)}>
              Aggiungi al carrello
            </Button>
          </Card.Footer>
        </Card>

        <Card variant="filled">
          <Card.Header title="Ai due estremi" subtitle={'align="between"'} />
          <Card.Footer align="between">
            <Button size="sm" variant="link" color="secondary">
              Dettagli
            </Button>
            <Button size="sm" color="danger">
              Elimina
            </Button>
          </Card.Footer>
        </Card>

        <Caption>
          La riga sopra le azioni attraversa tutta la scheda invece di fermarsi
          dentro la spaziatura: una linea che si ferma prima dei bordi si legge
          come decorazione, non come confine fra due regioni.
        </Caption>
        <Caption>
          `align="stack"` decide la direzione, non la larghezza. Un Button non
          fullWidth dichiara alignSelf per conto suo e batte l'alignItems del
          padre, che è il verso giusto: il controllo conosce la propria forma
          meglio della riga in cui si trova. Quindi la CTA piena si scrive
          fullWidth.
        </Caption>
      </Card>

      <Card tone="danger">
        <Card.Header
          title="Elimina il progetto"
          subtitle="Diciannove file e tre anni di cronologia. Non si torna indietro."
        />
        <Card.Footer divider>
          <Button size="sm" variant="ghost" color="secondary">
            Annulla
          </Button>
          <Button size="sm" color="danger">
            Elimina
          </Button>
        </Card.Footer>
      </Card>

      <Card
        variant="elevated"
        onPress={() => {}}
        accessibilityLabel="Apri la lampada Nord"
      >
        <Card.Media source={require('../assets/product.png')} />
        <Card.Header
          title="Lampada Nord"
          subtitle="Ceramica smaltata, 32 cm"
          action={<Typography variant="subtitle">89 €</Typography>}
        />
        <Typography variant="caption" color="muted">
          Il caso normale: fascia in cima, prezzo accanto al titolo come
          `action`, e la CTA in fondo.
        </Typography>
        <Card.Footer align="stack">
          <Button fullWidth onPress={() => setTapped(n => n + 1)}>
            Aggiungi al carrello · toccato {tapped}
          </Button>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Media
          source={require('../assets/landscape.png')}
          accessibilityLabel="Colline al tramonto"
        />
        <Card.Header
          title="Dove finisce la luce"
          subtitle="Reportage · 8 minuti di lettura"
        />
        <Caption>
          Questa ha un accessibilityLabel perché l'immagine dice qualcosa che il
          testo non dice. Quella del prodotto qui sopra no: è decorazione
          accanto a un titolo che la nomina già, e la cosa giusta per una
          decorazione è essere saltata.
        </Caption>
      </Card>

      <Card>
        <Card.Media source={{ uri: REMOTE }} />
        <Card.Header title="Da URL" subtitle="source={{ uri: … }}" />
        <Caption>
          `source` è quello di Image: un require locale oppure un oggetto con
          uri, con headers e cache se servono.
        </Caption>
        <Caption>
          Nota che lo spazio è già riservato prima che i byte arrivino, perché
          la fascia lavora su una proporzione e non su un'altezza da scoprire.
          Niente salto di layout quando l'immagine si posa.
        </Caption>
      </Card>

      <Card padding="lg" variant="elevated">
        <Card.Media source={require('../assets/abstract.png')} height={110} />
        <Card.Header
          title="Con padding lg e ombra"
          subtitle="Ritagliamo l'immagine, non la scheda"
        />
        <Caption>
          La fascia legge la spaziatura dal contesto, quindi con padding lg
          sborda di 24 invece che di 16 senza che tu le dica niente. Se
          arrotondassimo la scheda servirebbe overflow hidden, e quello toglie
          l'ombra su iOS mentre Android continua a disegnarla.
        </Caption>
      </Card>

      <Card>
        <Card.Header title="Fascia in mezzo" subtitle={'flush="none"'} />
        <Caption>
          Sopra la fascia c'è del contenuto, quindi niente margine negativo in
          alto e angoli quadri.
        </Caption>
        <Card.Media
          source={require('../assets/abstract.png')}
          height={70}
          flush="none"
        />
        <Caption>E sotto pure.</Caption>
      </Card>

      <Card variant="filled">
        <Card.Header
          title="Ombra e ritaglio"
          subtitle="L'unica trappola vera di elevated"
        />
        <Caption>
          L'ombra è disegnata fuori dai limiti della vista. Un antenato con
          overflow hidden la toglie su iOS, mentre Android continua a disegnarla
          perché elevation è una proprietà della vista e non un bordo dipinto.
          Per arrotondare un'immagine dentro una scheda elevata: ritaglia
          l'immagine, non la scheda.
        </Caption>
        <View />
      </Card>
    </>
  );
}
