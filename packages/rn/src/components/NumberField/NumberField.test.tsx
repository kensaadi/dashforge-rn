import { TextInput } from 'react-native';
import { DashFormProvider } from '@dashforge/forms';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { NumberField, formatNumber, parseNumber } from './NumberField';

const input = () => screen.UNSAFE_getByType(TextInput);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('reading what was typed', () => {
  it('reads a plain number', () => {
    expect(parseNumber('42', false)).toBe(42);
    expect(parseNumber('  42  ', false)).toBe(42);
    expect(parseNumber('-7', false)).toBe(-7);
  });

  it('takes both separators, because both are typed', () => {
    // An Italian keyboard offers a comma and an English one a full stop.
    expect(parseNumber('3,5', false)).toBe(3.5);
    expect(parseNumber('3.5', false)).toBe(3.5);
  });

  it('says nothing for the halfway states somebody types through', () => {
    // `-`, `3.` and `3,` are all on the way to a number. Returning
    // undefined is what lets the draft survive them.
    expect(parseNumber('', false)).toBeUndefined();
    expect(parseNumber('-', false)).toBeUndefined();
    expect(parseNumber('.', false)).toBeUndefined();
    expect(parseNumber('abc', false)).toBeUndefined();
  });

  it('drops the decimals a whole-number field cannot keep', () => {
    expect(parseNumber('3,9', true)).toBe(3);
    expect(parseNumber('-3,9', true)).toBe(-3);
  });

  it('puts an empty field back as empty, not as a zero', () => {
    expect(formatNumber(undefined)).toBe('');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('what it puts in the payload', () => {
  it('writes a number and not a string', () => {
    const onValueChange = jest.fn();
    render(
      <DashFormProvider>
        <NumberField name="quantity" label="Quantità" onValueChange={onValueChange} />
      </DashFormProvider>,
    );
    fireEvent.changeText(input(), '3');
    expect(onValueChange).toHaveBeenCalledWith(3);
    expect(onValueChange).not.toHaveBeenCalledWith('3');
  });

  it('writes undefined for an empty field, not zero', () => {
    // An empty field is the absence of an answer; a quantity of zero is
    // an answer, and the two must not arrive as the same thing.
    const onValueChange = jest.fn();
    render(
      <NumberField label="Quantità" value={5} onValueChange={onValueChange} />,
    );
    fireEvent.changeText(input(), '');
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  });

  it('is wired through the bridge, so the standalone warning stays quiet', () => {
    // The `TextField` underneath is deliberately given no `name`: this
    // component owns the conversation with the engine because that
    // conversation is about a number. It is still controlled, so the
    // warning about a field wired to nothing must not fire.
    render(
      <DashFormProvider>
        <NumberField name="quantity" label="Quantità" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the draft while typing', () => {
  it('keeps what was typed even when it is not a number yet', () => {
    render(<NumberField label="Prezzo" onValueChange={jest.fn()} />);
    fireEvent.changeText(input(), '3,');
    // A field that reformatted here would eat the separator as it was
    // typed and the second digit could never be entered.
    expect(input().props.value).toBe('3,');
  });

  it('keeps a lone minus sign long enough to type a number after it', () => {
    render(<NumberField label="Delta" onValueChange={jest.fn()} />);
    fireEvent.changeText(input(), '-');
    expect(input().props.value).toBe('-');
    fireEvent.changeText(input(), '-4');
    expect(input().props.value).toBe('-4');
  });

  it('tidies up when the field is left', () => {
    render(<NumberField label="Prezzo" onValueChange={jest.fn()} />);
    fireEvent.changeText(input(), '3,50');
    fireEvent(input(), 'blur');
    expect(input().props.value).toBe('3.5');
  });

  it('empties a field left holding nonsense', () => {
    render(<NumberField label="Prezzo" onValueChange={jest.fn()} />);
    fireEvent.changeText(input(), '-');
    fireEvent(input(), 'blur');
    expect(input().props.value).toBe('');
  });
});

describe('the fence', () => {
  it('is applied on leaving and not on every keystroke', () => {
    // Somebody typing `10` into a field with a minimum of `5` must not
    // watch their `1` turn into a `5`.
    const onValueChange = jest.fn();
    render(<NumberField label="Quantità" min={5} onValueChange={onValueChange} />);
    fireEvent.changeText(input(), '1');
    expect(input().props.value).toBe('1');
    fireEvent.changeText(input(), '10');
    expect(input().props.value).toBe('10');
    fireEvent(input(), 'blur');
    expect(input().props.value).toBe('10');
  });

  it('pulls a value back inside once the field is left', () => {
    const onValueChange = jest.fn();
    render(<NumberField label="Quantità" min={5} max={9} onValueChange={onValueChange} />);
    fireEvent.changeText(input(), '2');
    fireEvent(input(), 'blur');
    expect(input().props.value).toBe('5');
    expect(onValueChange).toHaveBeenLastCalledWith(5);
  });
});

describe('the steppers', () => {
  const minus = () => screen.getByLabelText('Diminuisci');
  const plus = () => screen.getByLabelText('Aumenta');

  it('are not there unless they were asked for', () => {
    render(<NumberField label="Quantità" onValueChange={jest.fn()} />);
    expect(screen.queryByLabelText('Aumenta')).toBeNull();
  });

  it('move by the step', () => {
    const onValueChange = jest.fn();
    render(
      <NumberField label="Quantità" value={4} step={2} steppers onValueChange={onValueChange} />,
    );
    fireEvent.press(plus());
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    fireEvent.press(minus());
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  it('start from the floor when the field is empty', () => {
    // The first press on a quantity should give the smallest allowed
    // rather than a bare 1.
    const onValueChange = jest.fn();
    render(<NumberField label="Quantità" min={2} steppers onValueChange={onValueChange} />);
    fireEvent.press(plus());
    expect(onValueChange).toHaveBeenLastCalledWith(2);
  });

  it('go inert at the fence rather than pretending to work', () => {
    render(<NumberField label="Quantità" value={1} min={1} max={3} steppers onValueChange={jest.fn()} />);
    expect(minus().props.accessibilityState.disabled).toBe(true);
    expect(plus().props.accessibilityState.disabled).toBe(false);
  });

  it('are inert with the field', () => {
    render(<NumberField label="Quantità" value={2} steppers disabled onValueChange={jest.fn()} />);
    expect(plus().props.accessibilityState.disabled).toBe(true);
  });
});

describe('what it tells a screen reader', () => {
  it('hands over the number and its fence', () => {
    render(<NumberField label="Quantità" value={3} min={1} max={9} onValueChange={jest.fn()} />);
    expect(input().props.accessibilityValue).toEqual({ now: 3, min: 1, max: 9 });
  });
});

describe('the keyboard', () => {
  it('offers a separator only when decimals are allowed', () => {
    const { unmount } = render(<NumberField label="Prezzo" onValueChange={jest.fn()} />);
    expect(input().props.keyboardType).toBe('decimal-pad');
    unmount();

    render(<NumberField label="Quantità" integer onValueChange={jest.fn()} />);
    expect(input().props.keyboardType).toBe('number-pad');
  });
});
