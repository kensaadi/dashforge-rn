import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { TabBar } from './TabBar';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).TabBar.tokens;
const Dot = ({ size, color }: { size?: number; color?: string }) => (
  <View testID="dot" style={{ width: size, backgroundColor: color }} />
);

const ITEMS = [
  { value: 'home', label: 'Home' },
  { value: 'inbox', label: 'Posta' },
  { value: 'me', label: 'Profilo' },
];

const destination = (label: string) => screen.getByLabelText(label);

beforeEach(() => setMode('light'));

describe('the bar', () => {
  it('draws one destination per item', () => {
    render(<TabBar testID="bar" items={ITEMS} value="home" />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Profilo')).toBeTruthy();
  });

  it('takes the safe area rather than guessing it', () => {
    render(<TabBar testID="bar" items={ITEMS} value="home" bottomInset={34} />);
    expect(flat(screen.getByTestId('bar').props.style).paddingBottom).toBe(34);
  });

  it('says which one you are on', () => {
    // `selected` and not `checked`: a destination is a place you are,
    // not an answer you gave.
    render(<TabBar testID="bar" items={ITEMS} value="inbox" />);
    expect(destination('Posta').props.accessibilityState.selected).toBe(true);
    expect(destination('Home').props.accessibilityState.selected).toBe(false);
  });

  it('tells the caller rather than navigating', () => {
    const onValueChange = jest.fn();
    render(<TabBar testID="bar" items={ITEMS} value="home" onValueChange={onValueChange} />);
    fireEvent.press(destination('Posta'));
    expect(onValueChange).toHaveBeenCalledWith('inbox');
  });

  it('colours the current one and leaves the rest neutral', () => {
    render(
      <TabBar
        testID="bar"
        items={[{ value: 'home', label: 'Home', icon: Dot }]}
        value="home"
      />,
    );
    expect(flat(screen.getByTestId('dot').props.style).backgroundColor).toBe(
      TOKENS.color.labelSelected,
    );
  });

  it('puts a badge over the icon rather than under the word', () => {
    // Laid out in the column it pushes the label down and reads as a
    // second line, which is what it did until somebody looked at it.
    render(
      <TabBar
        testID="bar"
        items={[{ value: 'inbox', label: 'Posta', badge: <Text testID="count">3</Text> }]}
        value="inbox"
      />,
    );
    const holder = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.position === 'absolute' && st.top === TOKENS.badge.top);
    expect(holder).toBeTruthy();
    expect(holder!.right).toBe(TOKENS.badge.right);
    expect(screen.getByTestId('count')).toBeTruthy();
  });
});

describe('being inert', () => {
  it('refuses one destination on its own', () => {
    const onValueChange = jest.fn();
    render(
      <TabBar
        testID="bar"
        items={[{ value: 'home', label: 'Home' }, { value: 'x', label: 'Spento', disabled: true }]}
        value="home"
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(destination('Spento'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'nav', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<TabBar testID="bar" items={ITEMS} value="home" visibleWhen={() => false} />);
    expect(screen.queryByText('Home')).toBeNull();
  });

  it('is inert when access disables it', () => {
    const onValueChange = jest.fn();
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <TabBar
          testID="bar"
          items={ITEMS}
          value="home"
          onValueChange={onValueChange}
          access={{ resource: 'nav', action: 'write', onUnauthorized: 'disable' }}
        />
      </RbacProvider>,
    );
    fireEvent.press(destination('Posta'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
