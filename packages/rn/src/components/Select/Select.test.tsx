import { useState } from 'react';
import { DashFormProvider, useDashFormContext } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Select } from './Select';
import type { RadioValue } from '../RadioGroup/radioGroup.types';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Select.tokens;
/** The closed control: a button that opens a list. */
const trigger = () => screen.getAllByRole('button')[0];
const rows = () => screen.getAllByRole('radio');

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

const plans = (extra: Record<string, unknown> = {}) => (
  <Select label="Piano" placeholder="Scegli" {...extra}>
    <Select.Option value="base" label="Base" />
    <Select.Option value="pro" label="Pro" />
    <Select.Option value="team" label="Team" disabled />
  </Select>
);

describe('the closed control', () => {
  it('says the placeholder until something is chosen', () => {
    render(plans());
    expect(screen.getByText('Scegli')).toBeTruthy();
  });

  it('colours the placeholder as one, so it does not read as answered', () => {
    render(plans());
    expect(flat(screen.getByText('Scegli').props.style).color).toBe(
      TOKENS.color.placeholder,
    );
  });

  it('says the chosen label once there is one', () => {
    render(plans({ defaultValue: 'pro' }));
    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.queryByText('Scegli')).toBeNull();
    expect(flat(screen.getByText('Pro').props.style).color).toBe(TOKENS.color.value);
  });

  it('tells assistive tech what it currently holds', () => {
    render(plans({ defaultValue: 'pro' }));
    // No combobox role exists in React Native, so it says it is a button
    // and says what is in it, which is more honest than borrowing a role
    // the platform will not support.
    expect(trigger().props.accessibilityValue).toEqual({ text: 'Pro' });
    expect(trigger().props.accessibilityState.expanded).toBe(false);
  });
});

describe('opening and choosing', () => {
  it('opens a list of radios, not a second implementation of one', () => {
    render(plans());
    fireEvent.press(trigger());
    // One answer among several already has a component, and it already
    // announces itself correctly.
    expect(rows()).toHaveLength(3);
    expect(trigger().props.accessibilityState.expanded).toBe(true);
  });

  it('reports the value and closes', async () => {
    const onValueChange = jest.fn();
    render(plans({ onValueChange }));
    fireEvent.press(trigger());
    fireEvent.press(rows()[1]);

    expect(onValueChange).toHaveBeenCalledWith('pro');
    await waitFor(() => expect(trigger().props.accessibilityState.expanded).toBe(false));
  });

  it('marks the chosen row when it opens again', () => {
    render(plans({ defaultValue: 'base' }));
    fireEvent.press(trigger());
    expect(rows()[0].props.accessibilityState.checked).toBe(true);
    expect(rows()[1].props.accessibilityState.checked).toBe(false);
  });

  it('keeps a disabled option unchoosable', () => {
    const onValueChange = jest.fn();
    render(plans({ onValueChange }));
    fireEvent.press(trigger());
    fireEvent.press(rows()[2]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('lets the caller own the selection', () => {
    function Host() {
      const [v, setV] = useState<RadioValue | undefined>(undefined);
      return plans({ value: v, onValueChange: setV });
    }
    render(<Host />);
    fireEvent.press(trigger());
    fireEvent.press(rows()[1]);
    // Asserted on the closed control and not by text: the list holds its
    // content while the panel leaves, so "Pro" is briefly on screen
    // twice, which is the Modal doing the right thing.
    expect(trigger().props.accessibilityValue).toEqual({ text: 'Pro' });
  });

  it('does not open when it is disabled', () => {
    render(plans({ disabled: true }));
    fireEvent.press(trigger());
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });
});

describe('in a form', () => {
  function Harness({ onSubmit }: { onSubmit: jest.Mock }) {
    const { rhf } = useDashFormContext();
    return (
      <>
        <Select name="plan" label="Piano" placeholder="Scegli">
          <Select.Option value={1} label="Base" />
          <Select.Option value={2} label="Pro" />
        </Select>
        <Pressable
          testID="submit"
          onPress={() => void rhf.handleSubmit((values) => onSubmit(values))()}
        >
          <Text>Invia</Text>
        </Pressable>
      </>
    );
  }

  it('carries the value through unchanged, number included', async () => {
    const onSubmit = jest.fn();
    render(
      <DashFormProvider>
        <Harness onSubmit={onSubmit} />
      </DashFormProvider>,
    );

    fireEvent.press(trigger());
    fireEvent.press(rows()[1]);
    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const value = onSubmit.mock.calls[0][0].plan;
    expect(value).toBe(2);
    expect(typeof value).toBe('number');
  });

  it('sends nothing when nothing was chosen, rather than inventing an answer', async () => {
    const onSubmit = jest.fn();
    render(
      <DashFormProvider>
        <Harness onSubmit={onSubmit} />
      </DashFormProvider>,
    );
    fireEvent.press(screen.getByTestId('submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    // Like RadioGroup and unlike Checkbox: nothing chosen is the absence
    // of an answer, not an answer.
    expect(onSubmit.mock.calls[0][0].plan).toBeUndefined();
  });

  it('reads its selection back from the engine', () => {
    render(
      <DashFormProvider defaultValues={{ plan: 'pro' }}>
        {plans({ name: 'plan' })}
      </DashFormProvider>,
    );
    expect(screen.getByText('Pro')).toBeTruthy();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [
      { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
      { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
    ],
  };

  it('hides when denied', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        {plans({ access: { resource: 'invoice', action: 'delete' } })}
      </RbacProvider>,
    );
    expect(screen.queryByText('Piano')).toBeNull();
  });

  it('honours visibleWhen', () => {
    render(plans({ visibleWhen: () => false }));
    expect(screen.queryByText('Piano')).toBeNull();
  });
});

describe('authoring mistakes', () => {
  it('ignores a child that is not an option, and says so', () => {
    render(
      <Select label="Piano">
        <Text>sciolto</Text>
        <Select.Option value="a" label="A" />
      </Select>,
    );
    fireEvent.press(trigger());
    expect(rows()).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not a <Select.Option>'));
  });

  it('renders nothing for an option outside a select', () => {
    render(<Select.Option value="a" label="Orfana" />);
    expect(screen.queryByText('Orfana')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside a <Select>'));
  });

  it('warns when nothing owns the selection', () => {
    render(plans({ name: 'plan' }));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('never report a change'));
  });
});
