import { useState } from 'react';
import { DashFormProvider, useDashFormContext } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { RadioGroup } from './RadioGroup';
import type { RadioValue } from './radioGroup.types';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const options = () => screen.getAllByRole('radio');
const checkedIndex = () =>
  options().findIndex((o) => o.props.accessibilityState.checked === true);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

const three = (extra: Record<string, unknown> = {}) => (
  <RadioGroup label="Consegna" {...extra}>
    <RadioGroup.Option value="standard" label="Standard" />
    <RadioGroup.Option value="express" label="Express" />
    <RadioGroup.Option value="pickup" label="Ritiro" />
  </RadioGroup>
);

describe('one answer among many', () => {
  it('starts from defaultValue', () => {
    render(three({ defaultValue: 'express' }));
    expect(checkedIndex()).toBe(1);
  });

  it('starts from none, because none is a legitimate state', () => {
    render(three());
    expect(checkedIndex()).toBe(-1);
  });

  it('moves the answer rather than adding one', () => {
    render(three({ defaultValue: 'standard' }));
    fireEvent.press(options()[2]);
    expect(checkedIndex()).toBe(2);
    expect(options().filter((o) => o.props.accessibilityState.checked === true)).toHaveLength(1);
  });

  it('does not unchoose when the chosen one is pressed again', () => {
    // A group holds one answer, and there is no way back to none from
    // inside it.
    render(three({ defaultValue: 'express' }));
    fireEvent.press(options()[1]);
    expect(checkedIndex()).toBe(1);
  });

  it('reports the value it was given, not an index', () => {
    const onValueChange = jest.fn();
    render(three({ onValueChange }));
    fireEvent.press(options()[2]);
    expect(onValueChange).toHaveBeenCalledWith('pickup');
  });

  it('lets the caller own the selection', () => {
    function Host() {
      const [v, setV] = useState<RadioValue>('standard');
      return three({ value: v, onValueChange: setV });
    }
    render(<Host />);
    fireEvent.press(options()[1]);
    expect(checkedIndex()).toBe(1);
  });

  it('selects from the label too, which is the bigger target', () => {
    const onValueChange = jest.fn();
    render(three({ onValueChange }));
    fireEvent.press(screen.getByText('Express'));
    expect(onValueChange).toHaveBeenCalledWith('express');
  });
});

describe('the group owns the field', () => {
  function Harness({ onSubmit }: { onSubmit: jest.Mock }) {
    const { rhf } = useDashFormContext();
    return (
      <>
        <RadioGroup name="shipping" label="Consegna">
          <RadioGroup.Option value="standard" label="Standard" />
          <RadioGroup.Option value={2} label="Express" />
        </RadioGroup>
        <Pressable
          testID="submit"
          onPress={() => void rhf.handleSubmit((values) => onSubmit(values))()}
        >
          <Text>Invia</Text>
        </Pressable>
      </>
    );
  }

  const submitAfter = async (index: number | null) => {
    const onSubmit = jest.fn();
    render(
      <DashFormProvider>
        <Harness onSubmit={onSubmit} />
      </DashFormProvider>,
    );
    if (index !== null) fireEvent.press(options()[index]);
    fireEvent.press(screen.getByTestId('submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    return onSubmit;
  };

  it('puts one key in the payload, not one per option', async () => {
    const onSubmit = await submitAfter(0);
    const values = onSubmit.mock.calls[0][0];
    expect(values).toEqual({ shipping: 'standard' });
  });

  it('carries a number through unchanged, since options are often keyed by id', async () => {
    const onSubmit = await submitAfter(1);
    const value = onSubmit.mock.calls[0][0].shipping;
    expect(value).toBe(2);
    expect(typeof value).toBe('number');
  });

  it('sends nothing when nothing was chosen, rather than inventing an answer', async () => {
    // Unlike Checkbox and Switch, which seed themselves: an unchecked
    // box is an answer, an untouched group is the absence of one.
    const onSubmit = await submitAfter(null);
    expect(onSubmit.mock.calls[0][0].shipping).toBeUndefined();
  });

  it('reads its selection back from the engine', () => {
    render(
      <DashFormProvider defaultValues={{ shipping: 'express' }}>
        {three({ name: 'shipping' })}
      </DashFormProvider>,
    );
    expect(checkedIndex()).toBe(1);
  });
});

describe('accessibility', () => {
  it('is one group with a name, not three loose controls', () => {
    render(three());
    // Queried by props and not by role: the container carries
    // `accessibilityRole="radiogroup"` but is deliberately *not* an
    // accessibility element of its own, because a container marked
    // `accessible` hides its children from VoiceOver, and the options
    // are exactly what has to stay reachable.
    const group = screen.UNSAFE_getByProps({ accessibilityRole: 'radiogroup' });
    expect(group.props.accessible).toBeUndefined();
    expect(group.props.accessibilityLabelledBy).toBeTruthy();
    expect(options()).toHaveLength(3);
  });

  it('says which one holds', () => {
    render(three({ defaultValue: 'pickup' }));
    expect(options()[2].props.accessibilityState.checked).toBe(true);
    expect(options()[0].props.accessibilityState.checked).toBe(false);
  });
});

describe('disabled', () => {
  it('disables every option from the group', () => {
    const onValueChange = jest.fn();
    render(three({ disabled: true, onValueChange }));
    fireEvent.press(options()[0]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(options()[0].props.accessibilityState.disabled).toBe(true);
  });

  it('disables one option on its own', () => {
    const onValueChange = jest.fn();
    render(
      <RadioGroup label="Consegna" onValueChange={onValueChange}>
        <RadioGroup.Option value="a" label="A" />
        <RadioGroup.Option value="b" label="B" disabled />
      </RadioGroup>,
    );
    fireEvent.press(options()[1]);
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.press(options()[0]);
    expect(onValueChange).toHaveBeenCalledWith('a');
  });
});

describe('invalid', () => {
  it('reddens the unanswered circles only', () => {
    const t = defaultComponentTokens(semanticLight).RadioGroup.tokens;
    render(three({ error: true, defaultValue: 'express', testID: 'g' }));
    // Reddening the chosen one would say the answer is wrong, when what
    // is wrong is that there is none.
    const [first] = options();
    const circle = first.children[0] as unknown as { props: { style: unknown } };
    expect(flat(circle.props.style).borderColor).toBe(t.color.borderInvalid);

    const chosen = options()[1].children[0] as unknown as { props: { style: unknown } };
    expect(flat(chosen.props.style).borderColor).toBe(t.color.borderChecked);
  });
});

describe('authoring mistakes', () => {
  it('renders nothing for an option outside a group, and says so', () => {
    render(<RadioGroup.Option value="a" label="Orfana" />);
    expect(screen.queryByText('Orfana')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside a <RadioGroup>'));
  });
});

describe('rbac', () => {
  const POLICY: RbacPolicy = {
    roles: [
      { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
      { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
    ],
  };

  const as = (roles: string[], ui: React.ReactElement) =>
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles }}>
        {ui}
      </RbacProvider>,
    );

  it('hides the whole group when denied', () => {
    as(['viewer'], three({ access: { resource: 'invoice', action: 'delete' } }));
    expect(screen.queryByText('Consegna')).toBeNull();
  });

  it('hides a single option when that option is denied', () => {
    as(
      ['viewer'],
      <RadioGroup label="Consegna">
        <RadioGroup.Option value="a" label="Normale" />
        <RadioGroup.Option
          value="b"
          label="Riservata"
          access={{ resource: 'invoice', action: 'delete' }}
        />
      </RadioGroup>,
    );
    expect(screen.getByText('Normale')).toBeTruthy();
    expect(screen.queryByText('Riservata')).toBeNull();
  });
});

describe('the standalone warning', () => {
  it('warns when nothing owns the selection', () => {
    render(three({ name: 'shipping' }));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('never report a change'));
  });

  it('stays quiet inside a form', () => {
    render(<DashFormProvider>{three({ name: 'shipping' })}</DashFormProvider>);
    expect(warn).not.toHaveBeenCalled();
  });
});
