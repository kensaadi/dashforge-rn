import { useState } from 'react';
import {
  DashFormProvider,
  useDashFormContext,
  useDashFormState,
} from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Checkbox } from './Checkbox';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

/** The control, found the way assistive tech finds it. */
const box = () => screen.getByRole('checkbox');
const boxStyle = () => flat(screen.getByTestId('cb').props.style);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('standalone', () => {
  it('starts from defaultChecked and toggles itself', () => {
    render(<Checkbox label="Ricordami" defaultChecked />);
    expect(box().props.accessibilityState.checked).toBe(true);
    fireEvent.press(box());
    expect(box().props.accessibilityState.checked).toBe(false);
  });

  it('reports the new state rather than the old one', () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox label="X" onCheckedChange={onCheckedChange} />);
    fireEvent.press(box());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('lets the caller own the state', () => {
    function Host() {
      const [on, setOn] = useState(false);
      return <Checkbox label="X" checked={on} onCheckedChange={setOn} />;
    }
    render(<Host />);
    fireEvent.press(box());
    expect(box().props.accessibilityState.checked).toBe(true);
  });

  it('toggles from the label too, which is the bigger target', () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox label="Iscrivimi" onCheckedChange={onCheckedChange} />);
    // The label is inside the pressable row, so pressing the row is
    // pressing the word.
    fireEvent.press(screen.getByText('Iscrivimi'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe('the boolean in the payload', () => {
  /**
   * The reason this component was built next. `TextField` proved the
   * bridge for text; a boolean is where a renderer usually turns out to
   * have been coercing everything through `String()`.
   */
  function Harness({ onSubmit }: { onSubmit: jest.Mock }) {
    const { rhf } = useDashFormContext();
    return (
      <>
        <Checkbox name="newsletter" label="Newsletter" />
        <Pressable testID="submit" onPress={() => void rhf.handleSubmit((values) => onSubmit(values))()}>
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
    if (press) fireEvent.press(screen.getByRole('checkbox'));
    fireEvent.press(screen.getByTestId('submit'));
    // handleSubmit is async, so give it the tick it needs to resolve.
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    return onSubmit;
  };

  it('puts a real true in the payload, not a string', async () => {
    const onSubmit = await submitAfter(true);
    const value = onSubmit.mock.calls[0][0].newsletter;
    expect(value).toBe(true);
    expect(typeof value).toBe('boolean');
  });

  it('puts a real false there when it was never touched', async () => {
    const onSubmit = await submitAfter(false);
    const value = onSubmit.mock.calls[0][0].newsletter;
    // Not `undefined`, and above all not the string "undefined", which
    // is what `String(v)` would have produced and which is truthy.
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
        <Checkbox name="newsletter" label="Newsletter" />
        <Dirt />
      </DashFormProvider>,
    );
    // Seeding writes a value, and a write that marked the form modified
    // would be worse than the missing key it fixes.
    expect(screen.getByTestId('dirty').props.children).toBe('false');
  });

  it('reads its state back from the engine', () => {
    render(
      <DashFormProvider defaultValues={{ newsletter: true }}>
        <Checkbox name="newsletter" label="Newsletter" />
      </DashFormProvider>,
    );
    expect(box().props.accessibilityState.checked).toBe(true);
  });
});

describe('indeterminate', () => {
  it('announces mixed rather than unchecked', () => {
    render(<Checkbox label="Tutti" indeterminate />);
    // A box that only looks indeterminate tells a screen reader it is
    // unchecked, which is a wrong answer and not a missing one.
    expect(box().props.accessibilityState.checked).toBe('mixed');
  });

  it('goes to checked from there, as a parent box over a partial list should', () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox label="Tutti" indeterminate onCheckedChange={onCheckedChange} />);
    fireEvent.press(box());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('is a filled box with a bar, not an empty one', () => {
    const tokens = defaultComponentTokens(semanticLight).Checkbox.tokens;
    render(<Checkbox testID="cb" label="Tutti" indeterminate />);
    const boxEl = screen.getByTestId('cb').children[0] as unknown as {
      props: { style: unknown };
    };
    // Deriving the state from `checked` alone left the bar with no
    // colour, which is to say invisible: a mixed box is a filled box.
    expect(flat(boxEl.props.style).backgroundColor).toBe(tokens.color.bgChecked);
  });

  it('stops being mixed once it is actually checked', () => {
    render(<Checkbox label="Tutti" indeterminate checked />);
    expect(box().props.accessibilityState.checked).toBe(true);
  });
});

describe('disabled', () => {
  it('does not toggle', () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox label="X" disabled onCheckedChange={onCheckedChange} />);
    fireEvent.press(box());
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(box().props.accessibilityState.disabled).toBe(true);
  });

  it('outranks invalid, because there is nothing to correct', () => {
    const t = defaultComponentTokens(semanticLight).Card.tokens;
    void t;
    render(<Checkbox testID="cb" label="X" disabled error sx={{ box: undefined }} />);
    const tokens = defaultComponentTokens(semanticLight).Checkbox.tokens;
    // The row carries the testID; the box is its first child.
    const boxEl = screen.getByTestId('cb').children[0] as unknown as {
      props: { style: unknown };
    };
    expect(flat(boxEl.props.style).borderColor).toBe(tokens.color.borderDisabled);
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
      <Checkbox label="Elimina tutto" access={{ resource: 'invoice', action: 'delete' }} />,
    );
    expect(screen.queryByText('Elimina tutto')).toBeNull();
  });

  it('collapses readonly into inert, since a box you cannot change is disabled', () => {
    const onCheckedChange = jest.fn();
    as(
      ['viewer'],
      <Checkbox
        label="X"
        onCheckedChange={onCheckedChange}
        access={{ resource: 'invoice', action: 'delete', onUnauthorized: 'readonly' }}
      />,
    );
    fireEvent.press(box());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe('the standalone warning', () => {
  it('warns when nothing owns the state', () => {
    render(<Checkbox name="terms" label="Accetto" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('never report a change'));
  });

  it('stays quiet inside a form', () => {
    render(
      <DashFormProvider>
        <Checkbox name="terms" label="Accetto" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('sizes', () => {
  it.each(['sm', 'md', 'lg'] as const)('%s', (size) => {
    const tokens = defaultComponentTokens(semanticLight).Checkbox.tokens;
    render(<Checkbox testID="cb" size={size} />);
    const boxEl = screen.getByTestId('cb').children[0] as unknown as {
      props: { style: unknown };
    };
    expect(flat(boxEl.props.style).width).toBe(tokens.box[size]);
    // The box is small on purpose; the target around it is not.
    expect(box().props.hitSlop).toBe(tokens.hitSlop[size]);
  });
});

void boxStyle;
