import { ActionSheetIOS, Platform } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { createActionSheet } from './createActionSheet';

const OPTIONS = [
  { key: 'camera', label: 'Scatta una foto' },
  { key: 'library', label: 'Scegli dalla galleria' },
  { key: 'remove', label: 'Rimuovi', destructive: true },
];

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  (Platform as { OS: string }).OS = 'ios';
  jest.restoreAllMocks();
});

describe('on iOS', () => {
  it('asks the platform rather than drawing one', () => {
    // Bucket three in ARCHITECTURE.md names action sheets as a system
    // surface: delegate, never reimplement.
    (Platform as { OS: string }).OS = 'ios';
    const show = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(() => {});

    const { showActionSheet } = createActionSheet();
    void showActionSheet({ title: 'La foto', options: OPTIONS });

    expect(show).toHaveBeenCalled();
    const [config] = show.mock.calls[0]!;
    expect(config.title).toBe('La foto');
    expect(config.options).toEqual([
      'Scatta una foto',
      'Scegli dalla galleria',
      'Rimuovi',
      'Annulla',
    ]);
    expect(config.cancelButtonIndex).toBe(3);
    expect(config.destructiveButtonIndex).toEqual([2]);
  });

  it('answers with what was picked', async () => {
    (Platform as { OS: string }).OS = 'ios';
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_config, callback) => callback(1));

    const { showActionSheet } = createActionSheet();
    await expect(showActionSheet({ options: OPTIONS })).resolves.toBe('library');
  });

  it('answers null when it was dismissed, because cancelling is an answer', async () => {
    (Platform as { OS: string }).OS = 'ios';
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_config, callback) => callback(3));

    const { showActionSheet } = createActionSheet();
    await expect(showActionSheet({ options: OPTIONS })).resolves.toBeNull();
  });

  it('draws nothing from the host, since the platform answered', () => {
    (Platform as { OS: string }).OS = 'ios';
    const { ActionSheetHost } = createActionSheet();
    render(<ActionSheetHost />);
    expect(screen.queryByText('Annulla')).toBeNull();
  });
});

describe('on Android', () => {
  it('draws one, because there is no platform sheet to ask for', async () => {
    (Platform as { OS: string }).OS = 'android';
    const { ActionSheetHost, showActionSheet } = createActionSheet();
    render(<ActionSheetHost />);

    void showActionSheet({ title: 'La foto', options: OPTIONS });
    await waitFor(() => expect(screen.getByText('Scatta una foto')).toBeTruthy());
    expect(screen.getByText('La foto')).toBeTruthy();
    expect(screen.getByText('Annulla')).toBeTruthy();
  });

  it('answers with what was pressed', async () => {
    (Platform as { OS: string }).OS = 'android';
    const { ActionSheetHost, showActionSheet } = createActionSheet();
    render(<ActionSheetHost />);

    const answer = showActionSheet({ options: OPTIONS });
    await waitFor(() => expect(screen.getByText('Rimuovi')).toBeTruthy());
    fireEvent.press(screen.getByText('Rimuovi'));
    await expect(answer).resolves.toBe('remove');
  });

  it('answers null when the way out is taken', async () => {
    (Platform as { OS: string }).OS = 'android';
    const { ActionSheetHost, showActionSheet } = createActionSheet();
    render(<ActionSheetHost />);

    const answer = showActionSheet({ options: OPTIONS });
    await waitFor(() => expect(screen.getByText('Annulla')).toBeTruthy());
    fireEvent.press(screen.getByText('Annulla'));
    await expect(answer).resolves.toBeNull();
  });

  it('says so when there is nowhere to draw it', async () => {
    (Platform as { OS: string }).OS = 'android';
    const { showActionSheet } = createActionSheet();
    await expect(showActionSheet({ options: OPTIONS })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no <ActionSheetHost> mounted'),
    );
  });

  it('refuses a second sheet while one is up', async () => {
    // Two questions on screen with one answer between them.
    (Platform as { OS: string }).OS = 'android';
    const { ActionSheetHost, showActionSheet } = createActionSheet();
    render(<ActionSheetHost />);

    const first = showActionSheet({ options: OPTIONS });
    await waitFor(() => expect(screen.getByText('Rimuovi')).toBeTruthy());
    await expect(showActionSheet({ options: OPTIONS })).resolves.toBeNull();

    fireEvent.press(screen.getByText('Rimuovi'));
    await expect(first).resolves.toBe('remove');
  });

  it('says so when two hosts are mounted from one channel', () => {
    (Platform as { OS: string }).OS = 'android';
    const { ActionSheetHost } = createActionSheet();
    render(
      <>
        <ActionSheetHost />
        <ActionSheetHost />
      </>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('More than one <ActionSheetHost>'),
    );
  });

  it('takes the way out by the name it was given', async () => {
    (Platform as { OS: string }).OS = 'android';
    const { ActionSheetHost, showActionSheet } = createActionSheet();
    render(<ActionSheetHost />);

    void showActionSheet({ options: OPTIONS, cancelLabel: 'Lascia stare' });
    await waitFor(() => expect(screen.getByText('Lascia stare')).toBeTruthy());
  });
});
