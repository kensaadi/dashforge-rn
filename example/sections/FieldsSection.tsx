import { useState } from 'react';
import { DashFormProvider } from '@dashforge/forms';
import {
  Button,
  Divider,
  NumberField,
  Textarea,
  Typography,
} from '@dashforge/rn';
import { Card, Caption } from '../ui';

export function FieldsSection() {
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(2);
  const [price, setPrice] = useState<number | undefined>(undefined);

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
