import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Animated, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { SegmentedControl } from './SegmentedControl';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).SegmentedControl.tokens;

const OPTIONS = [
  { value: 'monthly', label: 'Mensile' },
  { value: 'yearly', label: 'Annuale' },
];

const segment = (label: string) => screen.getByRole('radio', { name: label });

const track = () =>
  screen
    .UNSAFE_getAllByType(View)
    .find((v) => flat(v.props.style).backgroundColor === TOKENS.color.track)!;

const thumb = () =>
  screen
    .UNSAFE_queryAllByType(Animated.View)
    .find((v) => flat(v.props.style).backgroundColor === TOKENS.color.thumb);

/** The track is measured once; nothing is laid out in the test renderer. */
const measure = (width: number) =>
  act(() => {
    fireEvent(track(), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width, height: 44 } },
    });
  });

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('standalone', () => {
  it('draws a segment per option', () => {
    render(<SegmentedControl options={OPTIONS} onValueChange={jest.fn()} />);
    expect(screen.getByText('Mensile')).toBeTruthy();
    expect(screen.getByText('Annuale')).toBeTruthy();
  });

  it('answers on a press', () => {
    const onValueChange = jest.fn();
    render(<SegmentedControl options={OPTIONS} onValueChange={onValueChange} />);
    fireEvent.press(segment('Annuale'));
    expect(onValueChange).toHaveBeenCalledWith('yearly');
    expect(segment('Annuale').props.accessibilityState.checked).toBe(true);
  });

  it('says nothing when the segment pressed was already the answer', () => {
    const onValueChange = jest.fn();
    render(
      <SegmentedControl options={OPTIONS} value="yearly" onValueChange={onValueChange} />,
    );
    fireEvent.press(segment('Annuale'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('stays where the caller puts it when it is controlled', () => {
    const onValueChange = jest.fn();
    render(
      <SegmentedControl options={OPTIONS} value="monthly" onValueChange={onValueChange} />,
    );
    fireEvent.press(segment('Annuale'));
    expect(onValueChange).toHaveBeenCalledWith('yearly');
    // The caller did not move, so neither did the answer.
    expect(segment('Mensile').props.accessibilityState.checked).toBe(true);
  });

  it('starts on nothing unless it was told otherwise', () => {
    render(<SegmentedControl options={OPTIONS} onValueChange={jest.fn()} />);
    expect(segment('Mensile').props.accessibilityState.checked).toBe(false);
    expect(segment('Annuale').props.accessibilityState.checked).toBe(false);
  });
});

describe('in a form', () => {
  const wrap = (ui: React.ReactElement) => render(<DashFormProvider>{ui}</DashFormProvider>);

  it('registers and takes its value from the engine', () => {
    wrap(<SegmentedControl name="billing" options={OPTIONS} />);
    fireEvent.press(segment('Annuale'));
    expect(segment('Annuale').props.accessibilityState.checked).toBe(true);
  });

  it('does not seed itself, because nothing chosen is not an answer', () => {
    // A control that wrote its first option into the payload on mount
    // would turn a question nobody answered into one they did.
    const onValueChange = jest.fn();
    wrap(
      <SegmentedControl name="billing" options={OPTIONS} onValueChange={onValueChange} />,
    );
    expect(onValueChange).not.toHaveBeenCalled();
    expect(segment('Mensile').props.accessibilityState.checked).toBe(false);
  });

  it('is quiet about being unwired, since it is wired', () => {
    wrap(<SegmentedControl name="billing" options={OPTIONS} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('says so when it is wired to nothing at all', () => {
    render(<SegmentedControl options={OPTIONS} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SegmentedControl'));
  });
});

describe('the thumb', () => {
  it('is not drawn while nothing is chosen', () => {
    // The track shows through, which is what an unanswered question
    // should look like.
    render(<SegmentedControl options={OPTIONS} onValueChange={jest.fn()} />);
    measure(300);
    expect(thumb()).toBeUndefined();
  });

  it('is one share wide, which is arithmetic and not a measurement', () => {
    render(
      <SegmentedControl options={OPTIONS} value="monthly" onValueChange={jest.fn()} />,
    );
    measure(300);
    const share = (300 - TOKENS.inset * 2) / 2;
    expect(flat(thumb()!.props.style).width).toBe(share);
  });

  it('narrows as the options multiply', () => {
    render(
      <SegmentedControl
        options={[...OPTIONS, { value: 'weekly', label: 'Settimanale' }]}
        value="monthly"
        onValueChange={jest.fn()}
      />,
    );
    measure(300);
    expect(flat(thumb()!.props.style).width).toBe((300 - TOKENS.inset * 2) / 3);
  });

  it('keeps its corners concentric with the track it sits in', () => {
    render(
      <SegmentedControl options={OPTIONS} value="monthly" onValueChange={jest.fn()} />,
    );
    measure(300);
    expect(flat(thumb()!.props.style).borderRadius).toBe(TOKENS.radius - TOKENS.inset);
  });

  it('is decoration, and says nothing', () => {
    render(
      <SegmentedControl options={OPTIONS} value="monthly" onValueChange={jest.fn()} />,
    );
    measure(300);
    expect(thumb()!.props.accessibilityElementsHidden).toBe(true);
  });
});

describe('what it tells a screen reader', () => {
  it('is a group of radios and not a set of tabs', () => {
    // Which side of the boundary it falls on: a tab picks a view, this
    // picks an answer.
    render(
      <SegmentedControl
        testID="group"
        options={OPTIONS}
        value="monthly"
        onValueChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId('group').props.accessibilityRole).toBe('radiogroup');
    expect(segment('Mensile').props.accessibilityRole).toBe('radio');
  });

  it('reads the question once, above the answers', () => {
    render(
      <SegmentedControl
        testID="group"
        label="Fatturazione"
        options={OPTIONS}
        onValueChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Fatturazione')).toBeTruthy();
    expect(screen.getByTestId('group').props.accessibilityLabelledBy).toBeTruthy();
  });
});

describe('being inert', () => {
  it('disables every segment at once', () => {
    const onValueChange = jest.fn();
    render(<SegmentedControl options={OPTIONS} disabled onValueChange={onValueChange} />);
    fireEvent.press(segment('Annuale'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables one on its own', () => {
    const onValueChange = jest.fn();
    render(
      <SegmentedControl
        options={[OPTIONS[0]!, { ...OPTIONS[1]!, disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(segment('Annuale'));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.press(segment('Mensile'));
    expect(onValueChange).toHaveBeenCalledWith('monthly');
  });
});

describe('being wrong', () => {
  it('draws an edge and recolours the helper', () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        error
        helperText="Scegli una fatturazione"
        onValueChange={jest.fn()}
      />,
    );
    expect(flat(track().props.style).borderColor).toBe(semanticLight.feedback.danger.border);
    expect(flat(screen.getByText('Scegli una fatturazione').props.style).color).toBe(
      TOKENS.color.helperInvalid,
    );
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'billing', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        visibleWhen={() => false}
        onValueChange={jest.fn()}
      />,
    );
    expect(screen.queryByText('Mensile')).toBeNull();
  });

  it('is inert when access disables it', () => {
    const onValueChange = jest.fn();
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <SegmentedControl
          options={OPTIONS}
          access={{ resource: 'billing', action: 'write', onUnauthorized: 'disable' }}
          onValueChange={onValueChange}
        />
      </RbacProvider>,
    );
    fireEvent.press(segment('Annuale'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
