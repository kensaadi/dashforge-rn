import { ActivityIndicator, Animated } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Button } from '../Button/Button';
import { Spinner } from './Spinner';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Spinner.tokens;

const root = () => screen.getByTestId('spinner');
const rootStyle = () => flat(root().props.style);

beforeEach(() => setMode('light'));

describe('the ring', () => {
  it('is round at the size it was asked for', () => {
    render(<Spinner testID="spinner" size="lg" />);
    expect(rootStyle().width).toBe(TOKENS.size.lg);
    expect(rootStyle().height).toBe(TOKENS.size.lg);
    expect(rootStyle().borderRadius).toBe(TOKENS.size.lg / 2);
    expect(rootStyle().borderWidth).toBe(TOKENS.thickness.lg);
  });

  it('colours two sides and leaves two transparent, which is the arc', () => {
    render(<Spinner testID="spinner" color="danger" />);
    const s = rootStyle();
    expect(s.borderColor).toBe('transparent');
    expect(s.borderTopColor).toBe(semanticLight.action.danger.bg);
    expect(s.borderRightColor).toBe(semanticLight.action.danger.bg);
    expect(s.borderBottomColor).toBeUndefined();
  });

  it('takes an explicit tint over the role, for a ground no token knows', () => {
    render(<Spinner testID="spinner" color="danger" tint="#123456" />);
    expect(rootStyle().borderTopColor).toBe('#123456');
  });

  it('is turned by a rotation and nothing else', () => {
    render(<Spinner testID="spinner" />);
    // The test renderer flattens the interpolation to whatever it reads
    // now, so the turning itself is not observable from here, the same
    // way `PanResponder` is not. What is observable is the shape of the
    // transform and the lifetime of the loop, below.
    const transform = rootStyle().transform as { rotate: string }[];
    expect(transform).toEqual([{ rotate: '0deg' }]);
  });

  it('stops its loop when it goes away', () => {
    // The thing that actually leaks. A loop left running after unmount
    // keeps a native animation alive for a spinner nobody can see.
    const start = jest.fn();
    const stop = jest.fn();
    const loop = jest
      .spyOn(Animated, 'loop')
      .mockReturnValue({ start, stop, reset: jest.fn() } as never);

    const { unmount } = render(<Spinner testID="spinner" />);
    expect(start).toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();

    unmount();
    expect(stop).toHaveBeenCalled();
    loop.mockRestore();
  });
});

describe('what it tells a screen reader', () => {
  it('says it is busy even with no words, because that is what it means', () => {
    render(<Spinner testID="spinner" />);
    expect(root().props.accessibilityRole).toBe('progressbar');
    expect(root().props.accessibilityState).toEqual({ busy: true });
  });

  it('says what it is waiting for when it was told', () => {
    render(<Spinner testID="spinner" accessibilityLabel="Carico gli ordini" />);
    expect(root().props.accessibilityLabel).toBe('Carico gli ordini');
  });
});

describe('inside a Button', () => {
  it('replaces the platform indicator, so an application has one spinner', () => {
    // `ActivityIndicator` takes `small` or `large` and ignores a number
    // on iOS, so the same `md` would be two different sizes on the two
    // platforms. Appearance is ours on both.
    render(<Button loading>Salva</Button>);
    expect(screen.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
    expect(screen.UNSAFE_getAllByType(Animated.View).length).toBeGreaterThan(0);
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(<Spinner testID="spinner" visibleWhen={() => false} />);
    expect(screen.queryByTestId('spinner')).toBeNull();
  });
});
