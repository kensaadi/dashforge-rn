import { TextInput } from 'react-native';
import { DashFormProvider } from '@dashforge/forms';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { resolveTypeStyle } from '../../theme/typography';
import { Textarea } from './Textarea';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).TextField.tokens;
const LINE = resolveTypeStyle(TOKENS.typography.input).lineHeight!;

const input = () => screen.UNSAFE_getByType(TextInput);
const inputStyle = () => flat(input().props.style);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('the height', () => {
  it('is a real floor and not numberOfLines, which iOS ignores', () => {
    render(<Textarea label="Note" value="" onChangeText={jest.fn()} rows={5} />);
    expect(inputStyle().minHeight).toBe(5 * LINE);
    expect(input().props.numberOfLines).toBeUndefined();
  });

  it('is four lines unless asked otherwise', () => {
    render(<Textarea label="Note" value="" onChangeText={jest.fn()} />);
    expect(inputStyle().minHeight).toBe(4 * LINE);
  });

  it('grows without a ceiling until it is given one', () => {
    const { unmount } = render(<Textarea label="Note" value="" onChangeText={jest.fn()} />);
    expect(inputStyle().maxHeight).toBeUndefined();
    unmount();

    render(<Textarea label="Note" value="" onChangeText={jest.fn()} maxRows={8} />);
    expect(inputStyle().maxHeight).toBe(8 * LINE);
  });

  it('is derived from the type scale, so it follows the text-size setting', () => {
    // Not a magic number: a theme that changes the input's line height
    // moves the floor with it.
    render(<Textarea label="Note" value="" onChangeText={jest.fn()} rows={3} />);
    expect(inputStyle().minHeight).toBe(3 * LINE);
    expect(LINE).toBeGreaterThan(0);
  });
});

describe('being a field', () => {
  it('is multiline, which is the whole point', () => {
    render(<Textarea label="Note" value="" onChangeText={jest.fn()} />);
    expect(input().props.multiline).toBe(true);
  });

  it('starts the text at the top rather than the middle of a tall box', () => {
    render(<Textarea label="Note" value="" onChangeText={jest.fn()} />);
    expect(input().props.textAlignVertical).toBe('top');
  });

  it('registers with the form and takes its value from the engine', () => {
    render(
      <DashFormProvider>
        <Textarea name="note" label="Note" />
      </DashFormProvider>,
    );
    fireEvent.changeText(input(), 'due righe');
    expect(input().props.value).toBe('due righe');
  });
});

describe('the counter', () => {
  it('says how much room is left', () => {
    render(
      <DashFormProvider>
        <Textarea name="note" label="Note" maxLength={280} showCount />
      </DashFormProvider>,
    );
    expect(screen.getByText('0/280')).toBeTruthy();
    fireEvent.changeText(input(), 'ciao');
    expect(screen.getByText('4/280')).toBeTruthy();
  });

  it('counts a controlled value too', () => {
    render(
      <Textarea label="Note" value="ciao" onChangeText={jest.fn()} maxLength={10} showCount />,
    );
    expect(screen.getByText('4/10')).toBeTruthy();
  });

  it('gives way to a helper the caller wrote', () => {
    render(
      <Textarea
        label="Note"
        value="ciao"
        onChangeText={jest.fn()}
        maxLength={10}
        showCount
        helperText="Massimo dieci caratteri"
      />,
    );
    expect(screen.getByText('Massimo dieci caratteri')).toBeTruthy();
    expect(screen.queryByText('4/10')).toBeNull();
  });

  it('says so when there is no limit to count against', () => {
    render(<Textarea label="Note" value="" onChangeText={jest.fn()} showCount />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('showCount without a maxLength'));
  });

  it('draws nothing when it was not asked for', () => {
    render(<Textarea label="Note" value="ciao" onChangeText={jest.fn()} maxLength={10} />);
    expect(screen.queryByText('4/10')).toBeNull();
  });
});
