import { Image as RNImage, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { Image } from './Image';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Image.tokens;
const SRC = { uri: 'https://x/y.png' };

const box = () =>
  screen
    .UNSAFE_getAllByType(View)
    .find((v) => flat(v.props.style).overflow === 'hidden')!;
const picture = () => screen.UNSAFE_getByType(RNImage);

beforeEach(() => setMode('light'));

describe('the box', () => {
  it('holds the shape before the picture arrives', () => {
    // An Image with no height has none until it loads, and the page
    // jumps when it lands.
    render(<Image source={SRC} />);
    expect(flat(box().props.style).aspectRatio).toBe(16 / 9);
  });

  it('takes an explicit height instead of a shape', () => {
    render(<Image source={SRC} height={160} />);
    expect(flat(box().props.style).height).toBe(160);
    expect(flat(box().props.style).aspectRatio).toBeUndefined();
  });

  it('rounds by the scale', () => {
    render(<Image source={SRC} radius="md" />);
    expect(flat(box().props.style).borderRadius).toBe(TOKENS.radius.md);
  });

  it('stays visible on a card in dark, which fill.subtle would not', () => {
    setMode('dark');
    render(<Image source={SRC} />);
    expect(flat(box().props.style).backgroundColor).toBe(semanticDark.fill.default);
    expect(flat(box().props.style).backgroundColor).not.toBe(semanticDark.surface.raised);
  });
});

describe('while it is on its way', () => {
  it('keeps the picture rendered but invisible', () => {
    // An image that is not rendered never loads, and the fallback would
    // be all there ever was.
    render(<Image source={SRC} />);
    expect(flat(picture().props.style).opacity).toBe(0);
  });

  it('shows it once it has landed', () => {
    render(<Image source={SRC} />);
    fireEvent(picture(), 'load');
    expect(flat(picture().props.style).opacity).toBe(1);
  });

  it('draws what it was given to draw', () => {
    render(<Image source={SRC} fallback={<Text testID="wait">attendi</Text>} />);
    expect(screen.getByTestId('wait')).toBeTruthy();
    fireEvent(picture(), 'load');
    expect(screen.queryByTestId('wait')).toBeNull();
  });
});

describe('when it does not arrive', () => {
  it('shows a mark rather than a hole', () => {
    render(<Image source={SRC} />);
    fireEvent(picture(), 'error');
    expect(screen.UNSAFE_queryAllByType(RNImage)).toHaveLength(0);
    const arms = screen
      .UNSAFE_getAllByType(View)
      .filter((v) => flat(v.props.style).height === TOKENS.broken.thickness);
    expect(arms).toHaveLength(2);
  });

  it('shows what the caller wanted instead', () => {
    render(<Image source={SRC} errorFallback={<Text testID="oops">niente</Text>} />);
    fireEvent(picture(), 'error');
    expect(screen.getByTestId('oops')).toBeTruthy();
  });

  it('gives a new picture its own chance', () => {
    const { rerender } = render(<Image source={SRC} />);
    fireEvent(picture(), 'error');
    expect(screen.UNSAFE_queryAllByType(RNImage)).toHaveLength(0);

    rerender(<Image source={{ uri: 'https://x/works.png' }} />);
    expect(screen.UNSAFE_getAllByType(RNImage)).toHaveLength(1);
  });
});

describe('what it tells a screen reader', () => {
  it('says nothing when it was given nothing to say', () => {
    // A photograph beside a title that names it is decoration, and
    // decoration should be skipped rather than described twice.
    render(<Image source={SRC} />);
    expect(picture().props.accessible).toBe(false);
    expect(picture().props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('describes it when it was', () => {
    render(<Image source={SRC} accessibilityLabel="La copertina di Ada" />);
    expect(picture().props.accessibilityRole).toBe('image');
    expect(picture().props.accessibilityLabel).toBe('La copertina di Ada');
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(<Image source={SRC} visibleWhen={() => false} />);
    expect(screen.UNSAFE_queryAllByType(RNImage)).toHaveLength(0);
  });
});
