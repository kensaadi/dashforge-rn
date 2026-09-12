import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Platform, TextInput, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { OTPField } from './OTPField';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).OTPField.tokens;
const input = () => screen.UNSAFE_getByType(TextInput);

const boxes = () =>
  screen
    .UNSAFE_getAllByType(View)
    .filter((v) => flat(v.props.style).width === TOKENS.box.width);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  (Platform as { OS: string }).OS = 'ios';
});

describe('the boxes', () => {
  it('draws one per character', () => {
    render(<OTPField value="" onChangeText={jest.fn()} />);
    expect(boxes()).toHaveLength(6);
  });

  it('draws as many as it was asked for', () => {
    render(<OTPField length={4} value="" onChangeText={jest.fn()} />);
    expect(boxes()).toHaveLength(4);
  });

  it('shows what has been typed so far', () => {
    render(<OTPField value="123" onChangeText={jest.fn()} />);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });
});

describe('the one input behind them', () => {
  it('is one and not six', () => {
    // Six would look the same and behave nothing like it: backspace,
    // paste and focus are a fight with six and free with one.
    render(<OTPField value="" onChangeText={jest.fn()} />);
    expect(screen.UNSAFE_getAllByType(TextInput)).toHaveLength(1);
  });

  it('keeps only the digits out of whatever arrives', () => {
    // A paste of "Il tuo codice è 123456" leaves 123456.
    const onChangeText = jest.fn();
    render(<OTPField value="" onChangeText={onChangeText} />);
    fireEvent.changeText(input(), 'Il tuo codice è 123456');
    expect(onChangeText).toHaveBeenCalledWith('123456');
  });

  it('never takes more than the code is long', () => {
    const onChangeText = jest.fn();
    render(<OTPField length={4} value="" onChangeText={onChangeText} />);
    fireEvent.changeText(input(), '123456');
    expect(onChangeText).toHaveBeenCalledWith('1234');
  });

  it('asks the platform for the code', () => {
    // The reason somebody does not have to leave the app, read a
    // message and come back.
    render(<OTPField value="" onChangeText={jest.fn()} />);
    expect(input().props.textContentType).toBe('oneTimeCode');
    expect(input().props.autoComplete).toBe('one-time-code');
  });

  it('asks for it by the name Android knows', () => {
    (Platform as { OS: string }).OS = 'android';
    render(<OTPField value="" onChangeText={jest.fn()} />);
    expect(input().props.autoComplete).toBe('sms-otp');
  });

  it('is laid out rather than hidden, or it could not be autofilled', () => {
    // A field that is not laid out cannot be focused, and one that
    // cannot be focused cannot be filled by the platform either.
    render(<OTPField value="" onChangeText={jest.fn()} />);
    const style = flat(input().props.style);
    expect(style.display).not.toBe('none');
    expect(style.opacity).toBe(0);
  });
});

describe('being complete', () => {
  it('says so once, when the last box fills', () => {
    const onComplete = jest.fn();
    const { rerender } = render(
      <OTPField value="12345" onChangeText={jest.fn()} onComplete={onComplete} />,
    );
    expect(onComplete).not.toHaveBeenCalled();
    rerender(<OTPField value="123456" onChangeText={jest.fn()} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('does not say it twice for the same code', () => {
    const onComplete = jest.fn();
    const { rerender } = render(
      <OTPField value="123456" onChangeText={jest.fn()} onComplete={onComplete} />,
    );
    rerender(<OTPField value="123456" onChangeText={jest.fn()} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('says it again for a different code', () => {
    const onComplete = jest.fn();
    const { rerender } = render(
      <OTPField value="123456" onChangeText={jest.fn()} onComplete={onComplete} />,
    );
    rerender(<OTPField value="12345" onChangeText={jest.fn()} onComplete={onComplete} />);
    rerender(<OTPField value="123457" onChangeText={jest.fn()} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenLastCalledWith('123457');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

describe('what it tells a screen reader', () => {
  it('is one element with the whole code, not six saying nothing', () => {
    render(<OTPField label="Codice" value="123" onChangeText={jest.fn()} />);
    const field = screen.getByLabelText('Codice');
    expect(field.props.accessibilityValue.text).toBe('1 2 3');
    expect(input().props.accessibilityElementsHidden).toBe(true);
  });

  it('reads the message out when the code is wrong', () => {
    render(
      <OTPField label="Codice" value="123" error helperText="Codice errato" onChangeText={jest.fn()} />,
    );
    expect(screen.getByLabelText('Codice').props.accessibilityHint).toBe('Codice errato');
  });
});

describe('being wrong', () => {
  it('recolours the boxes and the helper', () => {
    render(
      <OTPField value="123" error helperText="Codice errato" onChangeText={jest.fn()} />,
    );
    expect(flat(boxes()[0]!.props.style).borderColor).toBe(TOKENS.color.borderInvalid);
    expect(flat(screen.getByText('Codice errato').props.style).color).toBe(
      TOKENS.color.helperInvalid,
    );
  });
});

describe('in a form', () => {
  it('registers and takes its value from the engine', () => {
    render(
      <DashFormProvider>
        <OTPField name="otp" label="Codice" />
      </DashFormProvider>,
    );
    fireEvent.changeText(input(), '1234');
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('is quiet about being unwired, since it is wired', () => {
    render(
      <DashFormProvider>
        <OTPField name="otp" label="Codice" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'auth', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<OTPField label="Codice" value="" onChangeText={jest.fn()} visibleWhen={() => false} />);
    expect(screen.queryByText('Codice')).toBeNull();
  });

  it('is inert when access disables it', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <OTPField
          label="Codice"
          value=""
          onChangeText={jest.fn()}
          access={{ resource: 'auth', action: 'write', onUnauthorized: 'disable' }}
        />
      </RbacProvider>,
    );
    expect(input().props.editable).toBe(false);
  });
});
