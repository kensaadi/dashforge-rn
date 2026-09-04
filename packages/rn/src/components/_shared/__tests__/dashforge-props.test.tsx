import { RbacProvider } from '@dashforge/rbac';
import type { RbacPolicy } from '@dashforge/rbac';
import { render, screen } from '@testing-library/react-native';
import { Button } from '../../Button/Button';
import { Typography } from '../../Typography/Typography';

/**
 * The two props that make this a Dashforge library rather than another
 * component kit. Tested together because the contract is shared and has
 * to stay identical across components: a rule that hides a Button must
 * hide a Typography the same way.
 */

const policy: RbacPolicy = {
  roles: [
    { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
    { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
  ],
};

const as = (roles: string[], ui: React.ReactElement) =>
  render(
    <RbacProvider policy={policy} subject={{ id: 'u1', roles }}>
      {ui}
    </RbacProvider>,
  );

describe('access', () => {
  const deleteInvoice = { resource: 'invoice', action: 'delete' } as const;

  it('renders when the subject is permitted', () => {
    as(['admin'], <Button access={deleteInvoice}>Elimina</Button>);
    expect(screen.getByText('Elimina')).toBeTruthy();
  });

  it('hides when denied, because hide is the default', () => {
    as(['viewer'], <Button access={deleteInvoice}>Elimina</Button>);
    expect(screen.queryByText('Elimina')).toBeNull();
  });

  it('disables instead when the requirement says so', () => {
    // `onUnauthorized` is the requirement's decision, not the
    // component's. The component consumes it and never overrides it.
    as(
      ['viewer'],
      <Button access={{ ...deleteInvoice, onUnauthorized: 'disable' }}>Elimina</Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('maps readonly to disabled on a Button, which has no readonly state', () => {
    as(
      ['viewer'],
      <Button access={{ ...deleteInvoice, onUnauthorized: 'readonly' }}>
        Elimina
      </Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies to Typography the same way', () => {
    as(['viewer'], <Typography access={deleteInvoice}>50.000</Typography>);
    expect(screen.queryByText('50.000')).toBeNull();
  });

  it('grants access and warns when no provider is mounted', () => {
    // Failing open on purpose. A silent deny is a regression found late;
    // an over-permissive dev build is found immediately, and a
    // production app that means to enforce permissions mounts the
    // provider.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Button access={deleteInvoice}>Elimina</Button>);
    expect(screen.getByText('Elimina')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('RbacProvider'));
    warn.mockRestore();
  });

  it('costs nothing when absent', () => {
    render(<Button>Salva</Button>);
    expect(screen.getByText('Salva')).toBeTruthy();
  });
});

describe('visibleWhen', () => {
  it('renders when the predicate holds', () => {
    render(<Button visibleWhen={() => true}>Avanti</Button>);
    expect(screen.getByText('Avanti')).toBeTruthy();
  });

  it('does not render when it does not', () => {
    render(<Button visibleWhen={() => false}>Avanti</Button>);
    expect(screen.queryByText('Avanti')).toBeNull();
  });

  it('applies to Typography the same way', () => {
    render(<Typography visibleWhen={() => false}>Nascosto</Typography>);
    expect(screen.queryByText('Nascosto')).toBeNull();
  });

  it('is independent of access: either one hides on its own', () => {
    as(
      ['admin'],
      <Button
        access={{ resource: 'invoice', action: 'delete' }}
        visibleWhen={() => false}
      >
        Elimina
      </Button>,
    );
    expect(screen.queryByText('Elimina')).toBeNull();
  });
});

describe('Typography', () => {
  it('announces a title as a heading without being asked', () => {
    render(<Typography variant="title">Ordini</Typography>);
    expect(screen.getByRole('header')).toBeTruthy();
  });

  it('does not make body text a heading', () => {
    render(<Typography>Testo</Typography>);
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('lets sx win over the variant', () => {
    render(<Typography sx={{ color: '#ff0000' }}>Testo</Typography>);
    const style = screen.getByText('Testo').props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.flat(9).filter(Boolean))
      : style;
    expect(flat.color).toBe('#ff0000');
  });

  it('carries the variant cap so reading text scales and labels do not', () => {
    render(<Typography variant="body">Corpo</Typography>);
    expect(screen.getByText('Corpo').props.maxFontSizeMultiplier).toBeUndefined();
    render(<Typography variant="label">Etichetta</Typography>);
    expect(screen.getByText('Etichetta').props.maxFontSizeMultiplier).toBeDefined();
  });
});
