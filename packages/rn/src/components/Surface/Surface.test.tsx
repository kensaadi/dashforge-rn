import { RbacProvider } from '@dashforge/rbac';
import type { RbacPolicy } from '@dashforge/rbac';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Surface } from './Surface';

/**
 * The matcher, on its own. No transition and no commit policy yet: those
 * decide *when* an answer is applied and are tested separately, because
 * the answer itself has to be provable without a clock.
 */

const Label = ({ children }: { children: string }) => <Text>{children}</Text>;

let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe('choosing a branch', () => {
  it('shows the case whose condition holds', () => {
    render(
      <Surface>
        <Surface.Case when={false}>
          <Label>dettagli</Label>
        </Surface.Case>
        <Surface.Case when={true}>
          <Label>offerta</Label>
        </Surface.Case>
      </Surface>,
    );

    expect(screen.getByText('offerta')).toBeTruthy();
    expect(screen.queryByText('dettagli')).toBeNull();
  });

  it('gives source order the priority when two cases hold', () => {
    render(
      <Surface>
        <Surface.Case when={true}>
          <Label>dettagli</Label>
        </Surface.Case>
        <Surface.Case when={true}>
          <Label>offerta</Label>
        </Surface.Case>
      </Surface>,
    );

    expect(screen.getByText('dettagli')).toBeTruthy();
    expect(screen.queryByText('offerta')).toBeNull();
  });

  it('falls back when no case holds', () => {
    render(
      <Surface>
        <Surface.Case when={false}>
          <Label>dettagli</Label>
        </Surface.Case>
        <Surface.Fallback>
          <Label>scheletro</Label>
        </Surface.Fallback>
      </Surface>,
    );

    expect(screen.getByText('scheletro')).toBeTruthy();
  });

  it('leaves the fallback alone when a case holds', () => {
    render(
      <Surface>
        <Surface.Case when={true}>
          <Label>dettagli</Label>
        </Surface.Case>
        <Surface.Fallback>
          <Label>scheletro</Label>
        </Surface.Fallback>
      </Surface>,
    );

    expect(screen.getByText('dettagli')).toBeTruthy();
    expect(screen.queryByText('scheletro')).toBeNull();
  });

  it('renders nothing at all when nothing matches and no fallback was written', () => {
    const { toJSON } = render(
      <Surface sx={{ padding: 24 }}>
        <Surface.Case when={false}>
          <Label>dettagli</Label>
        </Surface.Case>
      </Surface>,
    );

    // Not an empty view: an empty view would still carry the padding,
    // which is the opposite of taking no space.
    expect(toJSON()).toBeNull();
  });
});

describe('cost', () => {
  it('never calls the component of a branch that lost', () => {
    const Loser = jest.fn(() => <Text>perdente</Text>);
    const Winner = jest.fn(() => <Text>vincente</Text>);

    render(
      <Surface>
        <Surface.Case when={true}>
          <Winner />
        </Surface.Case>
        <Surface.Case when={false}>
          <Loser />
        </Surface.Case>
        <Surface.Fallback>
          <Loser />
        </Surface.Fallback>
      </Surface>,
    );

    expect(Winner).toHaveBeenCalled();
    expect(Loser).not.toHaveBeenCalled();
  });

  it('replaces the subtree on a change of branch instead of reconciling into it', () => {
    const mounted = jest.fn();
    const Card = ({ label }: { label: string }) => {
      // Mount-only, so this fires a second time solely if the subtree
      // was replaced. Reconciled in place, the effect would never re-run
      // and the outgoing card would never unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      useEffect(() => {
        mounted(label);
      }, []);
      return <Text>{label}</Text>;
    };

    const view = (ready: boolean) => (
      <Surface>
        <Surface.Case when={ready}>
          <Card label="personalizzato" />
        </Surface.Case>
        <Surface.Case when={!ready}>
          <Card label="generico" />
        </Surface.Case>
      </Surface>
    );

    const { rerender } = render(view(false));
    expect(screen.getByText('generico')).toBeTruthy();

    rerender(view(true));
    expect(screen.getByText('personalizzato')).toBeTruthy();
    expect(screen.queryByText('generico')).toBeNull();
    expect(mounted).toHaveBeenNthCalledWith(1, 'generico');
    expect(mounted).toHaveBeenNthCalledWith(2, 'personalizzato');
    expect(mounted).toHaveBeenCalledTimes(2);
  });

  it('gives the place back when the condition becomes true again', () => {
    const view = (ready: boolean) => (
      <Surface>
        <Surface.Case when={ready}>
          <Label>personalizzato</Label>
        </Surface.Case>
        <Surface.Fallback>
          <Label>generico</Label>
        </Surface.Fallback>
      </Surface>
    );

    const { rerender } = render(view(true));
    expect(screen.getByText('personalizzato')).toBeTruthy();

    rerender(view(false));
    expect(screen.getByText('generico')).toBeTruthy();

    // A pure function of state, so there is no memory of what was
    // already shown and nothing to reset.
    rerender(view(true));
    expect(screen.getByText('personalizzato')).toBeTruthy();
  });
});

describe('the Dashforge props', () => {
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

  const region = (
    <Surface access={{ resource: 'invoice', action: 'delete' }}>
      <Surface.Case when={true}>
        <Label>riservato</Label>
      </Surface.Case>
    </Surface>
  );

  it('renders the region when the subject is permitted', () => {
    as(['admin'], region);
    expect(screen.getByText('riservato')).toBeTruthy();
  });

  it('hides the whole region when access is denied, branches included', () => {
    as(['viewer'], region);
    expect(screen.queryByText('riservato')).toBeNull();
  });

  it('honours visibleWhen', () => {
    render(
      <Surface visibleWhen={() => false}>
        <Surface.Case when={true}>
          <Label>nascosto</Label>
        </Surface.Case>
      </Surface>,
    );

    expect(screen.queryByText('nascosto')).toBeNull();
  });
});

describe('authoring mistakes', () => {
  it('ignores a child that is not a branch, and says so', () => {
    render(
      <Surface>
        <Label>sciolto</Label>
        <Surface.Case when={true}>
          <Label>dentro</Label>
        </Surface.Case>
      </Surface>,
    );

    expect(screen.queryByText('sciolto')).toBeNull();
    expect(screen.getByText('dentro')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not a <Surface.Case>'));
  });

  it('still applies a case written after the fallback, but warns', () => {
    render(
      <Surface>
        <Surface.Fallback>
          <Label>scheletro</Label>
        </Surface.Fallback>
        <Surface.Case when={true}>
          <Label>dettagli</Label>
        </Surface.Case>
      </Surface>,
    );

    expect(screen.getByText('dettagli')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Move the fallback last'));
  });

  it('uses the first of several fallbacks', () => {
    render(
      <Surface>
        <Surface.Case when={false}>
          <Label>dettagli</Label>
        </Surface.Case>
        <Surface.Fallback>
          <Label>primo</Label>
        </Surface.Fallback>
        <Surface.Fallback>
          <Label>secondo</Label>
        </Surface.Fallback>
      </Surface>,
    );

    expect(screen.getByText('primo')).toBeTruthy();
    expect(screen.queryByText('secondo')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('more than one'));
  });

  it('renders nothing for a branch used outside a surface', () => {
    render(
      <Surface.Case when={true}>
        <Label>orfano</Label>
      </Surface.Case>,
    );

    expect(screen.queryByText('orfano')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside a <Surface>'));
  });
});
