import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { FAB } from './FAB';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).FAB.tokens;
const Dot = ({ size, color }: { size?: number; color?: string }) => (
  <View testID="dot" style={{ width: size, backgroundColor: color }} />
);

const fab = () => screen.getByLabelText('Nuovo ordine');

beforeEach(() => setMode('light'));

describe('what it says it is', () => {
  it('has a name, because a plus in a circle is announced as nothing', () => {
    // The one component here with no text to fall back on, which is why
    // the label is a required prop rather than a suggestion.
    render(<FAB icon={Dot} accessibilityLabel="Nuovo ordine" onPress={jest.fn()} />);
    expect(fab().props.accessibilityRole).toBe('button');
  });

  it('acts when it is pressed', () => {
    const onPress = jest.fn();
    render(<FAB icon={Dot} accessibilityLabel="Nuovo ordine" onPress={onPress} />);
    fireEvent.press(fab());
    expect(onPress).toHaveBeenCalled();
  });
});

describe('where it sits', () => {
  it('goes in the corner, above whatever it was told to clear', () => {
    // A button floating over a TabBar is a button covering a
    // destination, and only the caller knows what is under it.
    render(
      <FAB icon={Dot} accessibilityLabel="Nuovo ordine" onPress={jest.fn()} bottomInset={86} />,
    );
    expect(flat(fab().props.style).bottom).toBe(TOKENS.margin + 86);
    expect(flat(fab().props.style).right).toBe(TOKENS.margin);
  });

  it('goes to the other corner when asked', () => {
    render(
      <FAB
        icon={Dot}
        accessibilityLabel="Nuovo ordine"
        onPress={jest.fn()}
        position="bottom-start"
      />,
    );
    expect(flat(fab().props.style).left).toBe(TOKENS.margin);
    expect(flat(fab().props.style).right).toBeUndefined();
  });

  it('stays where it was put when the caller owns the layout', () => {
    render(
      <FAB icon={Dot} accessibilityLabel="Nuovo ordine" onPress={jest.fn()} position="none" />,
    );
    expect(flat(fab().props.style).position).toBeUndefined();
  });
});

describe('the shape', () => {
  it('is a circle at the size it was asked for', () => {
    render(
      <FAB icon={Dot} accessibilityLabel="Nuovo ordine" onPress={jest.fn()} size="lg" />,
    );
    expect(flat(fab().props.style).minWidth).toBe(TOKENS.size.lg);
    expect(flat(fab().props.style).paddingHorizontal).toBe(0);
  });

  it('becomes a pill once it carries a word', () => {
    render(
      <FAB icon={Dot} label="Scrivi" accessibilityLabel="Scrivi un messaggio" onPress={jest.fn()} />,
    );
    const button = screen.getByLabelText('Scrivi un messaggio');
    expect(screen.getByText('Scrivi')).toBeTruthy();
    expect(flat(button.props.style).paddingHorizontal).toBe(TOKENS.paddingHorizontal);
  });
});

describe('being inert', () => {
  it('does not act, and is dimmed', () => {
    const onPress = jest.fn();
    render(
      <FAB icon={Dot} accessibilityLabel="Nuovo ordine" onPress={onPress} disabled />,
    );
    fireEvent.press(fab());
    expect(onPress).not.toHaveBeenCalled();
    expect(flat(fab().props.style).opacity).toBe(semanticLight.opacity.disabled);
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'order', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(
      <FAB
        icon={Dot}
        accessibilityLabel="Nuovo ordine"
        onPress={jest.fn()}
        visibleWhen={() => false}
      />,
    );
    expect(screen.queryByLabelText('Nuovo ordine')).toBeNull();
  });

  it('is gone when access hides it, which is the usual answer for an action', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <FAB
          icon={Dot}
          accessibilityLabel="Nuovo ordine"
          onPress={jest.fn()}
          access={{ resource: 'order', action: 'write' }}
        />
      </RbacProvider>,
    );
    expect(screen.queryByLabelText('Nuovo ordine')).toBeNull();
  });
});
