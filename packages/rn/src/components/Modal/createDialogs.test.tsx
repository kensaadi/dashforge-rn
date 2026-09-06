import { Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createDialogs } from './createDialogs';
import type { DialogComponent } from './dialog.types';

let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

const SAVE = {
  title: 'Vuoi salvare?',
  message: 'Le modifiche non salvate andranno perse.',
  actions: [
    { value: 'cancel', label: 'Annulla' },
    { value: 'save', label: 'Salva' },
  ],
} as const;

describe('a question', () => {
  it('shows nothing until it is asked', () => {
    const { DialogHost } = createDialogs();
    render(
      <DialogHost>
        <Text>schermata</Text>
      </DialogHost>,
    );
    expect(screen.getByText('schermata')).toBeTruthy();
    expect(screen.queryByText('Vuoi salvare?')).toBeNull();
  });

  it('mounts what it was given and resolves with the answer pressed', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);

    let answer: unknown;
    await act(async () => {
      void ask(SAVE).then((value) => {
        answer = value;
      });
    });

    expect(screen.getByText('Vuoi salvare?')).toBeTruthy();
    expect(screen.getByText('Le modifiche non salvate andranno perse.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Salva'));
    });

    expect(answer).toBe('save');
    // Every action closes: shutting is not something a button does, it
    // is what happens once you have answered.
    expect(screen.queryByText('Vuoi salvare?')).toBeNull();
  });

  it('resolves null when it is dismissed without an answer', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);

    let answer: unknown = 'untouched';
    await act(async () => {
      void ask(SAVE).then((value) => {
        answer = value;
      });
    });

    await act(async () => {
      screen.UNSAFE_getByType(require('react-native').Modal).props.onRequestClose();
    });

    // Not confusable with any answer.
    expect(answer).toBeNull();
  });

  it('refuses to be dismissed when the question says so', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);

    let settled = false;
    await act(async () => {
      void ask({ ...SAVE, dismissible: false }).then(() => {
        settled = true;
      });
    });

    await act(async () => {
      screen.UNSAFE_getByType(require('react-native').Modal).props.onRequestClose();
    });

    expect(settled).toBe(false);
    expect(screen.getByText('Vuoi salvare?')).toBeTruthy();
  });
});

describe('a registered dialog', () => {
  const PickAddress: DialogComponent<{ userId: string }, string> = ({
    userId,
    close,
  }) => (
    <Text testID="pick" onPress={() => close(`via Roma, ${userId}`)}>
      Scegli
    </Text>
  );

  it('is found by name and resolves with what its close was given', async () => {
    const { DialogHost, ask } = createDialogs({ pickAddress: PickAddress });
    render(<DialogHost />);

    let chosen: unknown;
    await act(async () => {
      void ask({ dialog: 'pickAddress', props: { userId: 'u1' } }).then((value) => {
        chosen = value;
      });
    });

    expect(screen.getByTestId('pick')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('pick'));
    });

    expect(chosen).toBe('via Roma, u1');
  });

  it('says so when the name is not registered', async () => {
    const { DialogHost, ask } = createDialogs({ pickAddress: PickAddress });
    render(<DialogHost />);

    await act(async () => {
      // @ts-expect-error the point of the test is the unregistered name
      void ask({ dialog: 'missing' });
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No dialog is registered'));
  });
});

describe('the rules that are not negotiable', () => {
  it('rejects a second ask while one is open, rather than queueing', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);

    await act(async () => {
      void ask(SAVE);
    });

    // Queueing would hide the defect and reorder business logic nobody
    // wrote that way; resolving null would read as "closed without
    // answering" and skip the action in silence.
    await expect(ask(SAVE)).rejects.toThrow('already open');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already open'));
  });

  it('rejects when no host is mounted, since there is nowhere to show it', async () => {
    const { ask } = createDialogs();
    await expect(ask(SAVE)).rejects.toThrow('no <DialogHost> mounted');
  });

  it('lets the next ask through once the first has been answered', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);

    await act(async () => {
      void ask(SAVE);
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Annulla'));
    });

    let second: unknown;
    await act(async () => {
      void ask({ title: 'Ancora?', actions: [{ value: 'ok', label: 'Ok' }] }).then(
        (value) => {
          second = value;
        },
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Ok'));
    });

    expect(second).toBe('ok');
  });

  it('warns when a second host is mounted from the same channel', async () => {
    const { DialogHost } = createDialogs();
    render(
      <>
        <DialogHost />
        <DialogHost />
      </>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('More than one <DialogHost>'),
      ),
    );
  });
});

describe('how the answers are laid out', () => {
  it('makes the last one the affirmative and steps the others back', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);
    await act(async () => {
      void ask(SAVE);
    });

    // There is one obvious thing to do, and it is the one written last.
    const affirmative = screen.getByText('Salva');
    const secondary = screen.getByText('Annulla');
    expect(affirmative).toBeTruthy();
    expect(secondary).toBeTruthy();
  });

  it('stacks them when there are more than two', async () => {
    const { DialogHost, ask } = createDialogs();
    render(<DialogHost />);
    await act(async () => {
      void ask({
        title: 'Come procediamo?',
        actions: [
          { value: 'a', label: 'Prima' },
          { value: 'b', label: 'Seconda' },
          { value: 'c', label: 'Terza' },
        ],
      });
    });

    expect(screen.getByText('Prima')).toBeTruthy();
    expect(screen.getByText('Terza')).toBeTruthy();
  });
});
