import { useState } from 'react';
import {
  DashFormProvider,
  useDashFormContext,
  useDashFormState,
} from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { AccessibilityInfo, Pressable, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Switch } from './Switch';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

/** The control, found the way assistive tech finds it. */
const sw = () => screen.getByRole('switch');

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('standalone', () => {
  it('starts from defaultChecked and toggles itself', () => {
    render(<Switch label="Tema scuro" defaultChecked />);
    expect(sw().props.accessibilityState.checked).toBe(true);
    fireEvent.press(sw());
    expect(sw().props.accessibilityState.checked).toBe(false);
  });

  it('reports the new state rather than the old one', () => {
    const onCheckedChange = jest.fn();
    render(<Switch label="X" onCheckedChange={onCheckedChange} />);
    fireEvent.press(sw());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('lets the caller own the state', () => {
    function Host() {
      const [on, setOn] = useState(false);
      return <Switch label="X" checked={on} onCheckedChange={setOn} />;
    }
    render(<Host />);
    fireEvent.press(sw());
    expect(sw().props.accessibilityState.checked).toBe(true);
  });

  it('toggles from the label too', () => {
    const onCheckedChange = jest.fn();
    render(<Switch label="Notifiche" onCheckedChange={onCheckedChange} />);
    fireEvent.press(screen.getByText('Notifiche'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('announces itself as a switch and not as a checkbox', () => {
    // A different control with a different promise: a checkbox is a
    // choice to be submitted, a switch is a thing turning on now.
    render(<Switch label="X" />);
    expect(sw().props.accessibilityRole).toBe('switch');
  });
});

describe('the boolean in the payload', () => {
  function Harness({ onSubmit }: { onSubmit: jest.Mock }) {
    const { rhf } = useDashFormContext();
    return (
      <>
        <Switch name="notify" label="Notifiche" />
        <Pressable
          testID="submit"
          onPress={() => void rhf.handleSubmit((values) => onSubmit(values))()}
        >
          <Text>Invia</Text>
        </Pressable>
      </>
    );
  }

  const submitAfter = async (press: boolean) => {
    const onSubmit = jest.fn();
    render(
      <DashFormProvider>
        <Harness onSubmit={onSubmit} />
      </DashFormProvider>,
    );
    if (press) fireEvent.press(sw());
    fireEvent.press(screen.getByTestId('submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    return onSubmit;
  };

  it('puts a real true there', async () => {
    const onSubmit = await submitAfter(true);
    const value = onSubmit.mock.calls[0][0].notify;
    expect(value).toBe(true);
    expect(typeof value).toBe('boolean');
  });

  it('puts a real false there when it was never touched', async () => {
    const onSubmit = await submitAfter(false);
    const value = onSubmit.mock.calls[0][0].notify;
    // Off is an answer, not an absence, and above all not the string
    // "undefined", which is what `String(v)` would give and which is
    // truthy.
    expect(value).toBe(false);
    expect(typeof value).toBe('boolean');
  });

  it('leaves a freshly mounted form clean, despite having seeded itself', () => {
    function Dirt() {
      const { isDirty } = useDashFormState();
      return <Text testID="dirty">{String(isDirty)}</Text>;
    }
    render(
      <DashFormProvider>
        <Switch name="notify" label="Notifiche" />
        <Dirt />
      </DashFormProvider>,
    );
    expect(screen.getByTestId('dirty').props.children).toBe('false');
  });

  it('reads its state back from the engine', () => {
    render(
      <DashFormProvider defaultValues={{ notify: true }}>
        <Switch name="notify" label="Notifiche" />
      </DashFormProvider>,
    );
    expect(sw().props.accessibilityState.checked).toBe(true);
  });
});

describe('layout', () => {
  it('puts the switch after the label by default, as a settings row does', () => {
    render(<Switch testID="row" label="Notifiche" />);
    expect(flat(screen.getByTestId('row').props.style).flexDirection).toBe(
      'row-reverse',
    );
  });

  it('puts it before when asked, which reads better inside a form', () => {
    render(<Switch testID="row" side="start" label="Notifiche" />);
    expect(flat(screen.getByTestId('row').props.style).flexDirection).toBe('row');
  });

  it('centres the switch against the label rather than topping it', () => {
    // Unlike a checkbox: a switch is taller than a line of text, so
    // aligning it to the first line leaves it above the words.
    render(<Switch testID="row" label="Notifiche" />);
    expect(flat(screen.getByTestId('row').props.style).alignItems).toBe('center');
  });

  it.each(['sm', 'md', 'lg'] as const)('sizes the track and the target: %s', (size) => {
    const tokens = defaultComponentTokens(semanticLight).Switch.tokens;
    render(<Switch size={size} />);
    expect(sw().props.hitSlop).toBe(tokens.hitSlop[size]);
  });
});

describe('disabled', () => {
  it('does not toggle', () => {
    const onCheckedChange = jest.fn();
    render(<Switch label="X" disabled onCheckedChange={onCheckedChange} />);
    fireEvent.press(sw());
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(sw().props.accessibilityState.disabled).toBe(true);
  });
});

describe('motion', () => {
  it('jumps rather than travels when the platform asks for reduced motion', async () => {
    const enabled = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);

    render(<Switch label="X" />);
    await waitFor(() => expect(enabled).toHaveBeenCalled());
    fireEvent.press(sw());
    // The state still changes; only the manner does.
    expect(sw().props.accessibilityState.checked).toBe(true);

    // Re-mocked rather than restored: the React Native jest preset
    // already mocks AccessibilityInfo, and restoring the spy leaves the
    // method returning undefined for whatever runs next.
    enabled.mockResolvedValue(false);
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

  it('hides by default when denied', () => {
    as(
      ['viewer'],
      <Switch label="Modalità dio" access={{ resource: 'invoice', action: 'delete' }} />,
    );
    expect(screen.queryByText('Modalità dio')).toBeNull();
  });

  it('collapses readonly into inert', () => {
    const onCheckedChange = jest.fn();
    as(
      ['viewer'],
      <Switch
        label="X"
        onCheckedChange={onCheckedChange}
        access={{ resource: 'invoice', action: 'delete', onUnauthorized: 'readonly' }}
      />,
    );
    fireEvent.press(sw());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe('the standalone warning', () => {
  it('warns when nothing owns the state', () => {
    render(<Switch name="notify" label="Notifiche" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('never report a change'));
  });

  it('stays quiet inside a form', () => {
    render(
      <DashFormProvider>
        <Switch name="notify" label="Notifiche" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
