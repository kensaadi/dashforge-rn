import { useState } from 'react';
import { DashFormProvider } from '@dashforge/forms';
import {
  Button,
  Divider,
  NumberField,
  OTPField,
  SearchField,
  Slider,
  Textarea,
  Typography,
} from '@dashforge/rn';
import { Card, Caption } from '../ui';

export function FieldsSection() {
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(2);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [ran, setRan] = useState<string | null>(null);
  const [radius, setRadius] = useState(10);
  const [settled, setSettled] = useState(10);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState<string | null>(null);

  return (
    <>
      <Card>
        <Card.Header
          title="Textarea"
          subtitle="Un TextField con multiline, più la parte che è davvero diversa"
        />
        <Caption>
          rows è un'altezza vera, non numberOfLines: quella prop dimensiona la
          scatola su Android e non fa assolutamente niente su iOS. Il minimo qui
          è calcolato dall'interlinea del campo, quindi segue la scala
          tipografica e l'impostazione di dimensione del testo.
        </Caption>
        <Textarea
          label="Note"
          placeholder="Due righe bastano"
          value={note}
          onChangeText={setNote}
          rows={3}
          maxRows={6}
          maxLength={140}
          showCount
        />
      </Card>

      <Card>
        <Card.Header
          title="NumberField"
          subtitle="Esiste perché un payload deve contenere un numero"
        />
        <Caption>
          Un TextField con la tastiera numerica scrive "3", e poi una regola
          min:1 confronta una stringa, un'API riceve una stringa, e qualcuno lo
          ripara con un Number() a ogni chiamata. Questo scrive 3, e scrive
          undefined per un campo vuoto invece di 0: un campo vuoto è l'assenza
          di una risposta, una quantità di zero è una risposta.
        </Caption>
        <NumberField
          label="Quantità"
          value={quantity}
          onValueChange={setQuantity}
          min={1}
          max={99}
          integer
          steppers
        />
        <Typography color="muted">
          {`Valore: ${quantity === undefined ? 'undefined' : quantity} (${typeof quantity})`}
        </Typography>
        <Divider spacing="sm" />
        <Caption>
          Quello che si digita e quello che si memorizza sono due cose diverse.
          Prova a scrivere "3," qui sotto: il campo tiene i caratteri finché ha
          il cursore, perché "-", "3." e "3," sono tutti passi verso un numero.
          Il testo viene riscritto solo quando esci dal campo.
        </Caption>
        <NumberField
          label="Prezzo"
          placeholder="0,00"
          value={price}
          onValueChange={setPrice}
          min={0}
        />
        <Typography color="muted">
          {`Valore: ${price === undefined ? 'undefined' : price} (${typeof price})`}
        </Typography>
      </Card>

      <Card>
        <Card.Header
          title="SearchField"
          subtitle="onSearch è quello con cui lanciare una query"
        />
        <Caption>
          Un campo che interrogasse a ogni tasto manda otto richieste per una
          parola di otto lettere e mostra la risposta alla settima. L'attesa sta
          qui e non a ogni chiamata, perché sono le stesse quattro righe ogni
          volta e due si dimenticano: annullare allo smontaggio e annullare
          quando si preme cerca.
        </Caption>
        <SearchField
          placeholder="Cerca una città"
          value={query}
          onChangeText={setQuery}
          onSearch={q => setRan(q)}
        />
        <Typography color="muted">
          {ran === null
            ? 'Nessuna query ancora. Scrivi e fermati un attimo.'
            : `Query lanciata: "${ran}"`}
        </Typography>
      </Card>

      <Card>
        <Card.Header title="Slider" subtitle="onSlidingComplete è quello costoso" />
        <Caption>
          Un trascinamento riporta ogni passo che attraversa, e una richiesta
          per passo sono cento richieste per una risposta sola. Prende il tocco
          al down-press, come il BottomSheet: dentro una guida non c'è niente da
          premere, quindi non c'è niente da arbitrare, ed è quello che fa sì che
          un tap sulla guida ci porti il cursore invece di richiedere un
          trascinamento.
        </Caption>
        <Slider
          label="Raggio"
          min={1}
          max={50}
          value={radius}
          onValueChange={setRadius}
          onSlidingComplete={setSettled}
          formatValue={v => `${v} km`}
        />
        <Typography color="muted">{`Mentre trascini: ${radius} km. Rilasciato: ${settled} km.`}</Typography>
        <Divider spacing="sm" />
        <Slider label="A passi di cinque" max={100} step={5} defaultValue={25} onValueChange={() => {}} />
        <Slider label="Spento" value={30} disabled onValueChange={() => {}} />
      </Card>

      <Card>
        <Card.Header title="OTPField" subtitle="Un campo dietro sei caselle" />
        <Caption>
          Sei campi sembrerebbero uguali e si comporterebbero in modo
          completamente diverso: il backspace in una casella vuota deve tornare
          alla precedente e cancellare quello che c'è, un incolla deve riempirle
          tutte, e la tastiera deve restare su mentre il fuoco si sposta. Ognuna
          è una lotta con sei campi e gratis con uno.
        </Caption>
        <OTPField
          label="Codice"
          value={code}
          onChangeText={setCode}
          onComplete={setVerified}
          autoFocus={false}
        />
        <Typography color="muted">
          {verified ? `Completo: ${verified}` : 'Scrivi sei cifre.'}
        </Typography>
      </Card>

      <Card>
        <Card.Header title="Dentro una form" subtitle="Stesso ponte, tipi diversi" />
        <DashFormProvider>
          <Textarea name="descrizione" label="Descrizione" rows={2} />
          <NumberField name="pezzi" label="Pezzi" min={1} integer steppers />
          <Caption>
            La descrizione arriva nel payload come stringa e i pezzi come
            numero, senza che il chiamante converta niente.
          </Caption>
        </DashFormProvider>
      </Card>
    </>
  );
}
