import { useState } from 'react';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Button, Typography } from '@dashforge/rn';
import { Card, Caption, Label, Row } from '../ui';

const POLICY: RbacPolicy = {
  roles: [
    { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
    { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
  ],
};
const ROLES = ['admin', 'viewer'] as const;

export function AccessSection() {
  const [role, setRole] = useState<(typeof ROLES)[number]>('admin');

  return (
    <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: [role] }}>
      <Card>
        <Label>Ruolo</Label>
        <Caption>
          Il viewer può solo leggere le fatture. Sotto, lo stesso JSX.
        </Caption>
        <Row>
          {ROLES.map(r => (
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
      </Card>

      <Card>
        <Label>onUnauthorized</Label>
        <Caption>
          La decisione appartiene al requisito, non al componente.
        </Caption>
        <Row>
          <Button access={{ resource: 'invoice', action: 'read' }}>Apri</Button>
          <Button
            color="danger"
            access={{ resource: 'invoice', action: 'delete' }}
          >
            Elimina (hide)
          </Button>
          <Button
            color="danger"
            access={{
              resource: 'invoice',
              action: 'delete',
              onUnauthorized: 'disable',
            }}
          >
            Elimina (disable)
          </Button>
        </Row>
      </Card>

      <Card>
        <Label>Non solo i controlli</Label>
        <Caption>
          Anche il testo si nasconde, ed è spesso il caso che serve davvero.
        </Caption>
        <Typography access={{ resource: 'salary', action: 'read' }}>
          Stipendio: 50.000 euro
        </Typography>
        <Typography color="muted" variant="bodySmall">
          Nome: Maria Rossi
        </Typography>
      </Card>

      <Card>
        <Label>Senza provider</Label>
        <Caption>
          Fuori dal provider l'accesso è concesso e in sviluppo arriva un
          avviso. Un deny silenzioso è una regressione che scopri tardi.
        </Caption>
      </Card>
    </RbacProvider>
  );
}
