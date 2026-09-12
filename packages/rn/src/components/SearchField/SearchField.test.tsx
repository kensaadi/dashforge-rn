import { useState } from 'react';
import { DashFormProvider } from '@dashforge/forms';
import { TextInput } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { SearchField } from './SearchField';

const TOKENS = defaultComponentTokens(semanticLight).SearchField.tokens;
const input = () => screen.UNSAFE_getByType(TextInput);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  jest.useFakeTimers();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  warn.mockRestore();
});

function Host({ onSearch, ...rest }: Record<string, unknown>) {
  const [q, setQ] = useState('');
  return (
    <SearchField
      label="Cerca"
      value={q}
      onChangeText={setQ}
      onSearch={onSearch as (v: string) => void}
      {...rest}
    />
  );
}

describe('the waiting', () => {
  it('does not run a query on every keystroke', () => {
    // Eight requests for a word of eight letters, and the answer shown
    // is the seventh.
    const onSearch = jest.fn();
    render(<Host onSearch={onSearch} />);
    fireEvent.changeText(input(), 'm');
    fireEvent.changeText(input(), 'mi');
    fireEvent.changeText(input(), 'mil');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('runs one once the typing has stopped', () => {
    const onSearch = jest.fn();
    render(<Host onSearch={onSearch} />);
    fireEvent.changeText(input(), 'mil');
    act(() => jest.advanceTimersByTime(TOKENS.debounce));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('mil');
  });

  it('takes the wait from the caller', () => {
    const onSearch = jest.fn();
    render(<Host onSearch={onSearch} debounce={1000} />);
    fireEvent.changeText(input(), 'mil');
    act(() => jest.advanceTimersByTime(TOKENS.debounce));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1000 - TOKENS.debounce));
    expect(onSearch).toHaveBeenCalled();
  });

  it('does not wait at all when the list is already in memory', () => {
    const onSearch = jest.fn();
    render(<Host onSearch={onSearch} debounce={0} />);
    fireEvent.changeText(input(), 'm');
    expect(onSearch).toHaveBeenCalledWith('m');
  });

  it('never delays the text itself, which would drop characters', () => {
    render(<Host onSearch={jest.fn()} />);
    fireEvent.changeText(input(), 'mil');
    expect(input().props.value).toBe('mil');
  });

  it('drops what was waiting when the screen goes', () => {
    // A query fired from a screen that has gone is a query nobody is
    // waiting for, and on a slow list a state update on a dead tree.
    const onSearch = jest.fn();
    const { unmount } = render(<Host onSearch={onSearch} />);
    fireEvent.changeText(input(), 'mil');
    unmount();
    act(() => jest.advanceTimersByTime(TOKENS.debounce * 3));
    expect(onSearch).not.toHaveBeenCalled();
  });
});

describe('the search key', () => {
  it('runs at once and cancels what was waiting', () => {
    // Somebody who pressed search has stopped typing by definition.
    const onSearch = jest.fn();
    const onSubmit = jest.fn();
    render(<Host onSearch={onSearch} onSubmit={onSubmit} />);
    fireEvent.changeText(input(), 'mil');
    fireEvent(input(), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledWith('mil');
    expect(onSearch).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(TOKENS.debounce * 3));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('is the search key, and the keyboard stays up', () => {
    render(<Host onSearch={jest.fn()} />);
    expect(input().props.returnKeyType).toBe('search');
  });
});

describe('the cross', () => {
  const cross = () => screen.getByLabelText('Cancella la ricerca');

  it('is not there while there is nothing to empty', () => {
    render(<Host onSearch={jest.fn()} />);
    expect(screen.queryByLabelText('Cancella la ricerca')).toBeNull();
  });

  it('appears once there is', () => {
    render(<Host onSearch={jest.fn()} />);
    fireEvent.changeText(input(), 'mil');
    expect(cross()).toBeTruthy();
  });

  it('empties the field and says so at once', () => {
    const onSearch = jest.fn();
    const onSubmit = jest.fn();
    render(<Host onSearch={onSearch} onSubmit={onSubmit} />);
    fireEvent.changeText(input(), 'mil');
    fireEvent.press(cross());
    expect(input().props.value).toBe('');
    expect(onSubmit).toHaveBeenCalledWith('');
  });

  it('can be turned off', () => {
    render(<Host onSearch={jest.fn()} clearable={false} />);
    fireEvent.changeText(input(), 'mil');
    expect(screen.queryByLabelText('Cancella la ricerca')).toBeNull();
  });

  it('takes the name the caller wrote', () => {
    render(<Host onSearch={jest.fn()} clearLabel="Svuota" />);
    fireEvent.changeText(input(), 'mil');
    expect(screen.getByLabelText('Svuota')).toBeTruthy();
  });
});

describe('the keyboard it asks for', () => {
  it('turns off autocorrect and capitals', () => {
    // The difference between looking for `useRef` and looking for
    // `Useref`.
    render(<Host onSearch={jest.fn()} />);
    expect(input().props.autoCorrect).toBe(false);
    expect(input().props.autoCapitalize).toBe('none');
  });
});

describe('in a form', () => {
  it('registers and takes its value from the engine', () => {
    render(
      <DashFormProvider>
        <SearchField name="q" label="Cerca" onSearch={jest.fn()} />
      </DashFormProvider>,
    );
    fireEvent.changeText(input(), 'mil');
    expect(input().props.value).toBe('mil');
    expect(screen.getByLabelText('Cancella la ricerca')).toBeTruthy();
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(
      <SearchField
        label="Cerca"
        value=""
        onChangeText={jest.fn()}
        visibleWhen={() => false}
      />,
    );
    expect(screen.queryByText('Cerca')).toBeNull();
  });
});
