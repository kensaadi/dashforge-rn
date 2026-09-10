import { Image, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Avatar, initialsOf } from './Avatar';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Avatar.tokens;
const rootStyle = () => flat(screen.getByTestId('avatar').props.style);

beforeEach(() => setMode('light'));

describe('the initials', () => {
  it('takes the first letter of the first word and of the last', () => {
    expect(initialsOf('Kenjy Saadi')).toBe('KS');
    expect(initialsOf('Ada Byron King')).toBe('AK');
  });

  it('gives one letter for one word, because two would read as a truncation', () => {
    expect(initialsOf('Kenjy')).toBe('K');
  });

  it('survives the whitespace a real name arrives with', () => {
    expect(initialsOf('  kenjy   saadi  ')).toBe('KS');
    expect(initialsOf('   ')).toBe('');
    expect(initialsOf('')).toBe('');
  });

  it('counts a character and not a code unit', () => {
    // A name starting outside the basic plane would come back as half a
    // character if this split on indexes.
    expect(initialsOf('🙂 saadi')).toBe('🙂S');
  });
});

describe('what it shows', () => {
  it('shows the picture when it has one', () => {
    render(<Avatar testID="avatar" source={{ uri: 'https://x/y.png' }} name="Kenjy Saadi" />);
    expect(screen.UNSAFE_getAllByType(Image)).toHaveLength(1);
    expect(screen.queryByText('KS')).toBeNull();
  });

  it('falls back to the initials when there is no picture', () => {
    render(<Avatar testID="avatar" name="Kenjy Saadi" />);
    expect(screen.getByText('KS')).toBeTruthy();
  });

  it('falls back to the icon when there is no name either', () => {
    const Dot = ({ size, color }: { size?: number; color?: string }) => (
      <View testID="dot" style={{ width: size, backgroundColor: color }} />
    );
    render(<Avatar testID="avatar" icon={Dot} />);
    const s = flat(screen.getByTestId('dot').props.style);
    expect(s.width).toBe(TOKENS.iconSize.md);
    expect(s.backgroundColor).toBe(TOKENS.color.fg);
  });

  it('falls back again when the picture fails to load', () => {
    // The case a component that only looks at its props gets wrong: a
    // URL that 404s leaves a hole where a face was.
    render(<Avatar testID="avatar" source={{ uri: 'https://x/gone.png' }} name="Kenjy Saadi" />);
    fireEvent(screen.UNSAFE_getAllByType(Image)[0]!, 'error');
    expect(screen.getByText('KS')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  });

  it('gives a new picture its own chance', () => {
    const { rerender } = render(
      <Avatar testID="avatar" source={{ uri: 'https://x/gone.png' }} name="Kenjy Saadi" />,
    );
    fireEvent(screen.UNSAFE_getAllByType(Image)[0]!, 'error');
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);

    rerender(<Avatar testID="avatar" source={{ uri: 'https://x/works.png' }} name="Kenjy Saadi" />);
    expect(screen.UNSAFE_getAllByType(Image)).toHaveLength(1);
  });
});

describe('the shape', () => {
  it('is a circle at the size it was asked for', () => {
    render(<Avatar testID="avatar" name="Kenjy Saadi" size="lg" />);
    expect(rootStyle().width).toBe(TOKENS.size.lg);
    expect(rootStyle().height).toBe(TOKENS.size.lg);
    expect(rootStyle().borderRadius).toBe(TOKENS.radius.full);
  });

  it('takes a step off the radius scale when a face is not what it holds', () => {
    render(<Avatar testID="avatar" name="Acme" radius="md" />);
    expect(rootStyle().borderRadius).toBe(TOKENS.radius.md);
  });

  it('clips the picture rather than rounding it', () => {
    render(<Avatar testID="avatar" source={{ uri: 'https://x/y.png' }} />);
    expect(rootStyle().overflow).toBe('hidden');
  });

  it('grows the letters with the circle', () => {
    render(<Avatar testID="avatar" name="Kenjy Saadi" size="xl" />);
    expect(flat(screen.getByText('KS').props.style).fontSize).toBe(TOKENS.fontSize.xl);
  });
});

describe('what it tells a screen reader', () => {
  it('is one element with one name, not a circle full of letters', () => {
    render(<Avatar testID="avatar" name="Kenjy Saadi" />);
    const root = screen.getByTestId('avatar');
    expect(root.props.accessibilityLabel).toBe('Kenjy Saadi');
    expect(root.props.accessibilityRole).toBe('image');
    expect(screen.getByText('KS').props.importantForAccessibility).toBe('no');
  });

  it('says nothing when there is nobody to name', () => {
    render(<Avatar testID="avatar" />);
    expect(screen.getByTestId('avatar').props.accessible).toBe(false);
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(<Avatar testID="avatar" name="Kenjy Saadi" visibleWhen={() => false} />);
    expect(screen.queryByTestId('avatar')).toBeNull();
  });
});
