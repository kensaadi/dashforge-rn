import { Keyboard, Modal as RNModal, StyleSheet, Text, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { BottomSheet, nearestSnap, shouldDismiss } from './BottomSheet';
import type { BottomSheetRadius } from './bottomSheet.types';

const flat = (style: unknown) =>
  (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;

const TOKENS = defaultComponentTokens(semanticLight).BottomSheet.tokens;
const host = () => screen.UNSAFE_getByType(RNModal);
const scrim = () =>
  screen
    .UNSAFE_getAllByType(View)
    .find((v) => flat(v.props.style).backgroundColor === TOKENS.scrim)!;

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

/**
 * The gesture itself is not exercised here: React Native's test renderer
 * does not run `PanResponder`, so a test that pretended to drag would be
 * testing nothing. What is testable is the judgement the release makes,
 * which is why it lives outside the closure.
 */
describe('letting go', () => {
  const limits = { dismissRatio: 0.25, dismissVelocity: 0.5 };
  const HEIGHT = 400;

  it('dismisses once the drag is past the quarter mark', () => {
    expect(shouldDismiss({ dy: 101, vy: 0 }, HEIGHT, limits)).toBe(true);
    expect(shouldDismiss({ dy: 99, vy: 0 }, HEIGHT, limits)).toBe(false);
  });

  it('dismisses a short flick, because speed is an intention', () => {
    // Twenty points is nothing, and the finger left the screen already
    // moving away. Distance alone would spring this back and feel like
    // the sheet fought the user.
    expect(shouldDismiss({ dy: 20, vy: 0.9 }, HEIGHT, limits)).toBe(true);
  });

  it('keeps a slow long push distinct from a slow short one', () => {
    expect(shouldDismiss({ dy: 200, vy: 0.1 }, HEIGHT, limits)).toBe(true);
    expect(shouldDismiss({ dy: 40, vy: 0.1 }, HEIGHT, limits)).toBe(false);
  });

  it('ignores upward movement, which is a negative dy', () => {
    // Pulling up on a sheet that is already up should do nothing, not
    // dismiss it because the magnitude was large.
    expect(shouldDismiss({ dy: -300, vy: -2 }, HEIGHT, limits)).toBe(false);
  });

  it('scales with the sheet, not with the screen', () => {
    // A quarter of a small sheet is a small push; the same absolute
    // distance would be most of the way for one and nothing for another.
    expect(shouldDismiss({ dy: 60, vy: 0 }, 200, limits)).toBe(true);
    expect(shouldDismiss({ dy: 60, vy: 0 }, 600, limits)).toBe(false);
  });
});

/**
 * The other half of the release, and pure for the same reason: which
 * detent a finger meant is a judgement, and one made inside a gesture
 * closure is one nothing can check.
 */
describe('choosing a detent', () => {
  // A sheet on a 800 point screen with detents at 0.4 and 0.9: the tall
  // one rests at 0, the short one 400 points further down.
  const OFFSETS = [400, 0];

  it('takes the nearest one when the finger stopped', () => {
    expect(nearestSnap(OFFSETS, 380, 0)).toBe(0);
    expect(nearestSnap(OFFSETS, 120, 0)).toBe(1);
  });

  it('reads a flick as where the sheet was going', () => {
    // Barely moved off the tall detent, but let go moving down hard
    // enough to cover the rest. Distance alone would snap it back up and
    // feel like the sheet refused.
    expect(nearestSnap(OFFSETS, 60, 3)).toBe(0);
    expect(nearestSnap(OFFSETS, 340, -3)).toBe(1);
  });

  it('never leaves the detents it was given', () => {
    expect(nearestSnap(OFFSETS, -500, -9)).toBe(1);
    expect(nearestSnap(OFFSETS, 9000, 9)).toBe(0);
  });

  it('has an answer with a single detent, which is that one', () => {
    expect(nearestSnap([0], 250, 4)).toBe(0);
  });
});

describe('opening and closing', () => {
  it('is not presented until it is opened', () => {
    render(
      <BottomSheet open={false}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(host().props.visible).toBe(false);
  });

  it('shows its content when open', () => {
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(host().props.visible).toBe(true);
    expect(screen.getByText('dentro')).toBeTruthy();
  });

  it('asks rather than closing itself', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    fireEvent.press(scrim());
    expect(onClose).toHaveBeenCalled();
    expect(host().props.visible).toBe(true);
  });

  it('answers the Android back button through the same door', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    host().props.onRequestClose();
    expect(onClose).toHaveBeenCalled();
  });

  it('refuses both when it is not dismissible', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet open dismissible={false} onClose={onClose}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    fireEvent.press(scrim());
    host().props.onRequestClose();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the content on screen while it is leaving', async () => {
    const { rerender } = render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    rerender(<BottomSheet open={false} />);

    // Same reason as `Modal`: a caller that stops rendering children the
    // instant it closes would leave an empty sheet sliding away.
    expect(screen.getByText('dentro')).toBeTruthy();
    await waitFor(() => expect(host().props.visible).toBe(false));
  });
});

describe('the grabber', () => {
  it('is also a button, because a drag is not a gesture a reader can make', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    // `accessibilityTap` and not `press`: the strip claims the touch at
    // down-press so that the bar itself can be dragged, which leaves the
    // reader's activation as the only way in that is not a gesture.
    fireEvent(screen.getByLabelText('Chiudi'), 'accessibilityTap');
    expect(onClose).toHaveBeenCalled();
  });

  it('is not a button when there is no way out to offer', () => {
    render(
      <BottomSheet open dismissible={false}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(screen.queryByLabelText('Chiudi')).toBeNull();
  });

  it('says so when it is hidden and is also the only drag target', () => {
    render(
      <BottomSheet open showHandle={false}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('only thing that is invisible'),
    );
  });

  it('says nothing when the whole sheet is the drag target', () => {
    render(
      <BottomSheet open showHandle={false} dragFrom="anywhere">
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the sheet', () => {
  const sheet = () =>
    screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.backgroundColor === TOKENS.bg && st.maxHeight !== undefined)!;

  it('is square by default, because the rounding is decoration', () => {
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().borderTopLeftRadius).toBe(0);
    expect(sheet().borderTopRightRadius).toBe(0);
  });

  it('rounds only the corners that are not against the screen edge', () => {
    render(
      <BottomSheet open radius="xxl">
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().borderTopLeftRadius).toBe(TOKENS.radius.xxl);
    expect(sheet().borderTopRightRadius).toBe(TOKENS.radius.xxl);
    expect(sheet().borderBottomLeftRadius).toBeUndefined();
    expect(sheet().borderBottomRightRadius).toBeUndefined();
  });

  it('takes the step by name, not the number', () => {
    render(
      <BottomSheet open radius="sm">
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().borderTopLeftRadius).toBe(TOKENS.radius.sm);
  });

  it('does not offer the step it cannot honour', () => {
    // `full` on a surface this wide resolves to a dome that curves out
    // from under the content. The scale still holds the value, because
    // it is one table for every component; the sheet's prop type does
    // not offer it.
    // @ts-expect-error 'full' is excluded from BottomSheetRadius
    const refused: BottomSheetRadius = 'full';
    expect(refused).toBe('full');
    expect(TOKENS.radius.full).toBeGreaterThan(TOKENS.radius.xxl);
  });

  it('takes the safe area below the content rather than guessing it', () => {
    render(
      <BottomSheet open bottomInset={34}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().paddingBottom).toBe(TOKENS.padding + 34);
  });

  it('stops before it has taken the whole screen', () => {
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().maxHeight).toBeGreaterThan(0);
  });
});

/**
 * The gesture is claimed at touch-down rather than on the first move,
 * because inside a `Modal` this platform never offers the move. That is
 * not visible in a rendered tree, but which view is asking for it is,
 * and that is the part a refactor would get wrong.
 */
describe('the drag target', () => {
  const claims = (element: { props: Record<string, unknown> }) => {
    const ask = element.props.onStartShouldSetResponder as
      | (() => boolean)
      | undefined;
    return ask ? ask() : false;
  };

  const sheetView = () =>
    screen
      .UNSAFE_getAllByType(View)
      .find(
        (v) =>
          flat(v.props.style).backgroundColor === TOKENS.bg &&
          flat(v.props.style).maxHeight !== undefined,
      )!;

  it('is the strip by default, and never the sheet under it', () => {
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(claims(screen.getByLabelText('Chiudi'))).toBe(true);
    expect(claims(sheetView())).toBe(false);
  });

  it('is the whole sheet when it is told to be, and then not the strip', () => {
    render(
      <BottomSheet open dragFrom="anywhere">
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(claims(sheetView())).toBe(true);
    expect(claims(screen.getByLabelText('Chiudi'))).toBe(false);
  });
});

describe('resizing', () => {
  /** What the React Native jest preset reports for the window. */
  const SCREEN = 1334;

  const sheet = () =>
    screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.backgroundColor === TOKENS.bg)!;

  it('is laid out at the tallest detent, because a detent is a translation', () => {
    render(
      <BottomSheet open snapPoints={[0.4, 0.9]}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().height).toBe(SCREEN * 0.9);
    // The cap is there too, and with the keyboard away it is simply the
    // token's own ratio: a detent taller than the cap would put its
    // heading off the top of the screen.
    expect(sheet().maxHeight).toBe(SCREEN * TOKENS.maxHeightRatio);
  });

  it('stays content-sized when nobody asked for detents', () => {
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().height).toBeUndefined();
    expect(sheet().maxHeight).toBeGreaterThan(0);
  });

  it('offers the reader the two moves the drag makes', () => {
    render(
      <BottomSheet open snapPoints={[0.4, 0.9]}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    const names = (
      screen.getByLabelText('Chiudi').props.accessibilityActions as
        | { name: string }[]
        | undefined
    )?.map((a) => a.name);
    expect(names).toEqual(['expand', 'collapse']);
  });

  it('offers them only when there is more than one detent', () => {
    render(
      <BottomSheet open snapPoints={[0.5]}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(screen.getByLabelText('Chiudi').props.accessibilityActions).toBeUndefined();
  });

  it('moves between detents when the reader asks', () => {
    const onSnapChange = jest.fn();
    render(
      <BottomSheet open snapPoints={[0.4, 0.9]} onSnapChange={onSnapChange}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    const handle = screen.getByLabelText('Chiudi');
    fireEvent(handle, 'accessibilityAction', {
      nativeEvent: { actionName: 'expand' },
    });
    expect(onSnapChange).toHaveBeenCalledWith(1);

    fireEvent(handle, 'accessibilityAction', {
      nativeEvent: { actionName: 'collapse' },
    });
    expect(onSnapChange).toHaveBeenLastCalledWith(0);
  });

  it('says nothing when the reader asks for a detent it is already at', () => {
    const onSnapChange = jest.fn();
    render(
      <BottomSheet open snapPoints={[0.4, 0.9]} onSnapChange={onSnapChange}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    fireEvent(screen.getByLabelText('Chiudi'), 'accessibilityAction', {
      nativeEvent: { actionName: 'collapse' },
    });
    expect(onSnapChange).not.toHaveBeenCalled();
  });

  it('says so when the detents are not in order', () => {
    render(
      <BottomSheet open snapPoints={[0.9, 0.4]}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('strictly ascending'));
  });

  it('says so when it is told to open on a detent that is not there', () => {
    render(
      <BottomSheet open snapPoints={[0.4, 0.9]} initialSnap={5}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside snapPoints'));
  });
});

describe('the keyboard', () => {
  const sheet = () =>
    screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.backgroundColor === TOKENS.bg && st.maxHeight !== undefined)!;

  /** The container that holds the sheet against the bottom edge. */
  const floor = () =>
    screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.justifyContent === 'flex-end' && st.flex === 1)!;

  // The preset's `Keyboard` has no way to emit, so the listeners are
  // caught as they are registered and called by hand. `willShow` and not
  // `didShow`: iOS announces the keyboard before it animates, which is
  // what lets the sheet travel with it instead of jumping after it.
  const listeners = new Map<string, (event: unknown) => void>();
  let addListener: jest.SpyInstance;

  beforeEach(() => {
    listeners.clear();
    addListener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation(((event: string, handler: (e: unknown) => void) => {
        listeners.set(event, handler);
        return { remove: () => listeners.delete(event) };
      }) as never);
  });

  afterEach(() => addListener.mockRestore());

  const raise = (height: number) =>
    act(() => {
      listeners.get('keyboardWillShow')?.({ endCoordinates: { height } });
    });

  const lower = () =>
    act(() => {
      listeners.get('keyboardWillHide')?.({});
    });

  it('sits on the keyboard rather than under it', () => {
    // Scrolling the content was not enough and is not what the platform
    // does: iOS brings the caret into view and no more, so a four-line
    // field showed one line and going to a new line pushed the text back
    // out of sight.
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(floor().paddingBottom).toBe(0);
    raise(336);
    expect(floor().paddingBottom).toBe(336);
  });

  it('gives back the height it borrowed', () => {
    render(
      <BottomSheet open>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    raise(336);
    lower();
    expect(floor().paddingBottom).toBe(0);
  });

  it('shrinks its cap by as much, or its heading goes off the top', () => {
    render(
      <BottomSheet open snapPoints={[0.9]}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    raise(336);
    expect(sheet().maxHeight).toBe(1334 * TOKENS.maxHeightRatio - 336);
  });

  it('drops the safe-area inset, which the keyboard is standing on', () => {
    // Keeping both would leave a band of empty sheet on top of the keys.
    render(
      <BottomSheet open bottomInset={34}>
        <Text>dentro</Text>
      </BottomSheet>,
    );
    expect(sheet().paddingBottom).toBe(TOKENS.padding + 34);
    raise(336);
    expect(sheet().paddingBottom).toBe(TOKENS.padding);
  });
});

describe('the Dashforge props', () => {
  it('stays shut when visibleWhen says so', () => {
    render(
      <BottomSheet open visibleWhen={() => false}>
        <Text>nascosto</Text>
      </BottomSheet>,
    );
    expect(host().props.visible).toBe(false);
  });
});
