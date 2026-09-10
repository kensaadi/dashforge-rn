import { AccessibilityInfo, Animated, View } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { Skeleton } from './Skeleton';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Skeleton.tokens;

/** Hidden from the reader, so the query has to ask for it. */
const root = () => screen.getByTestId('skeleton', { includeHiddenElements: true });
const rootStyle = () => flat(root().props.style);

const blocks = () =>
  screen
    .UNSAFE_queryAllByType(Animated.View)
    .filter((v) => flat(v.props.style).backgroundColor === TOKENS.color);

beforeEach(() => setMode('light'));

describe('the block', () => {
  it('fills the width it was given and takes a line height by default', () => {
    render(<Skeleton testID="skeleton" />);
    expect(rootStyle().width).toBe('100%');
    expect(rootStyle().height).toBe(TOKENS.line.height);
  });

  it('takes any width and height, because a shape is not on a scale', () => {
    render(<Skeleton testID="skeleton" width={120} height={44} />);
    expect(rootStyle().width).toBe(120);
    expect(rootStyle().height).toBe(44);
  });

  it('stands in for an avatar when it is round and square', () => {
    render(<Skeleton testID="skeleton" width={40} height={40} radius="full" />);
    expect(rootStyle().borderRadius).toBe(TOKENS.radius.full);
  });

  it('stays visible on a card in dark, which fill.subtle would not', () => {
    // `fill.subtle` and `surface.raised` are the same value in dark, so a
    // skeleton tinted with subtle would be an invisible block on a card.
    setMode('dark');
    render(<Skeleton testID="skeleton" />);
    expect(rootStyle().backgroundColor).toBe(semanticDark.fill.default);
    expect(rootStyle().backgroundColor).not.toBe(semanticDark.surface.raised);
  });
});

describe('the paragraph', () => {
  it('draws the lines it was asked for', () => {
    render(<Skeleton.Text testID="skeleton" lines={4} />);
    expect(blocks()).toHaveLength(4);
  });

  it('ends short, because a paragraph does not end at the margin', () => {
    render(<Skeleton.Text testID="skeleton" lines={3} />);
    const widths = blocks().map((b) => flat(b.props.style).width);
    expect(widths).toEqual(['100%', '100%', TOKENS.line.lastWidth]);
  });

  it('keeps a single line full width, since one line is not a paragraph', () => {
    render(<Skeleton.Text testID="skeleton" lines={1} />);
    expect(flat(blocks()[0]!.props.style).width).toBe('100%');
  });

  it('takes the short width from the caller', () => {
    render(<Skeleton.Text testID="skeleton" lines={2} lastWidth="30%" />);
    expect(flat(blocks()[1]!.props.style).width).toBe('30%');
  });

  it('draws nothing rather than throwing on a nonsense count', () => {
    render(<Skeleton.Text testID="skeleton" lines={-3} />);
    expect(blocks()).toHaveLength(0);
  });
});

describe('motion', () => {
  it('breathes by default', () => {
    const start = jest.fn();
    const loop = jest
      .spyOn(Animated, 'loop')
      .mockReturnValue({ start, stop: jest.fn(), reset: jest.fn() } as never);

    render(<Skeleton testID="skeleton" />);
    expect(start).toHaveBeenCalled();
    loop.mockRestore();
  });

  it('stops its loop when it goes away', () => {
    const stop = jest.fn();
    const loop = jest
      .spyOn(Animated, 'loop')
      .mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() } as never);

    const { unmount } = render(<Skeleton testID="skeleton" />);
    unmount();
    expect(stop).toHaveBeenCalled();
    loop.mockRestore();
  });

  it('holds still when the platform asks for reduced motion', async () => {
    // Unlike `Spinner`, which keeps turning: a spinner is one small
    // element that means nothing standing still, while a loading screen
    // is a field of blocks all breathing at once, which is the motion
    // the setting exists to switch off.
    //
    // The setting is read asynchronously, so the honest thing to assert
    // is the transition and not a steady state: the first frame breathes
    // because nothing has answered yet, and the answer tears the pulse
    // down and does not build another.
    const enabled = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const stop = jest.fn();
    const loop = jest
      .spyOn(Animated, 'loop')
      .mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() } as never);

    render(<Skeleton testID="skeleton" />);
    await waitFor(() => expect(enabled).toHaveBeenCalled());
    await waitFor(() => expect(stop).toHaveBeenCalled());
    expect(loop).toHaveBeenCalledTimes(1);

    loop.mockRestore();
    // Re-mocked rather than restored: the React Native jest preset
    // already mocks AccessibilityInfo, and restoring the spy leaves the
    // method returning undefined for whatever runs next.
    enabled.mockResolvedValue(false);
  });
});

describe('what it tells a screen reader', () => {
  it('says nothing, because eight grey rectangles are worse than silence', () => {
    render(<Skeleton testID="skeleton" />);
    expect(root().props.accessibilityElementsHidden).toBe(true);
    expect(root().props.importantForAccessibility).toBe('no-hide-descendants');
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(<Skeleton testID="skeleton" visibleWhen={() => false} />);
    expect(
      screen.queryByTestId('skeleton', { includeHiddenElements: true }),
    ).toBeNull();
  });

  it('hides the paragraph too', () => {
    render(<Skeleton.Text testID="skeleton" visibleWhen={() => false} />);
    expect(screen.UNSAFE_queryAllByType(View)).toHaveLength(0);
  });
});
