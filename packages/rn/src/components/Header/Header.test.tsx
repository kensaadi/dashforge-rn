import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Header } from './Header';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Header.tokens;
const bar = () => screen.getByTestId('header');

beforeEach(() => setMode('light'));

describe('the bar', () => {
  it('announces the title as a heading', () => {
    render(<Header testID="header" title="Ordini" />);
    expect(screen.getByText('Ordini').props.accessibilityRole).toBe('header');
  });

  it('leaves a node alone', () => {
    render(<Header testID="header" title={<Text testID="own">Ordini</Text>} />);
    expect(screen.getByTestId('own')).toBeTruthy();
  });

  it('takes the safe area rather than guessing it', () => {
    // Inventing a number for the notch is how a bar ends up under the
    // clock on exactly one phone.
    render(<Header testID="header" title="Ordini" topInset={59} />);
    expect(flat(bar().props.style).paddingTop).toBe(59);
  });

  it('draws the hairline unless it is told not to', () => {
    const { unmount } = render(<Header testID="header" title="Ordini" />);
    expect(flat(bar().props.style).borderBottomWidth).toBe(TOKENS.border.thickness);
    unmount();

    render(<Header testID="header" title="Ordini" divider={false} />);
    expect(flat(bar().props.style).borderBottomWidth).toBe(0);
  });

  it('uses the opaque separator, since content scrolls under it', () => {
    // A hairline you can see through stops being a hairline as the page
    // moves.
    render(<Header testID="header" title="Ordini" />);
    expect(flat(bar().props.style).borderBottomColor).toBe(semanticLight.separator.opaque);
  });
});

describe('the way back', () => {
  it('is not drawn unless there is somewhere to go', () => {
    render(<Header testID="header" title="Ordini" />);
    expect(screen.queryByLabelText('Indietro')).toBeNull();
  });

  it('tells the caller rather than going back itself', () => {
    // The navigator is theirs. A header that called goBack() would have
    // reimplemented the only part of a router anybody notices.
    const onBack = jest.fn();
    render(<Header testID="header" title="Ordini" onBack={onBack} />);
    fireEvent.press(screen.getByLabelText('Indietro'));
    expect(onBack).toHaveBeenCalled();
  });

  it('takes the name the caller wrote', () => {
    render(<Header testID="header" title="Ordini" onBack={jest.fn()} backLabel="Torna" />);
    expect(screen.getByLabelText('Torna')).toBeTruthy();
  });

  it("steps aside for a leading of the caller's own", () => {
    render(
      <Header
        testID="header"
        title="Ordini"
        onBack={jest.fn()}
        leading={<Text testID="menu">menu</Text>}
      />,
    );
    expect(screen.getByTestId('menu')).toBeTruthy();
    expect(screen.queryByLabelText('Indietro')).toBeNull();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'order', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<Header testID="header" title="Ordini" visibleWhen={() => false} />);
    expect(screen.queryByText('Ordini')).toBeNull();
  });

  it('is gone when access hides it', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Header testID="header" title="Ordini" access={{ resource: 'order', action: 'write' }} />
      </RbacProvider>,
    );
    expect(screen.queryByText('Ordini')).toBeNull();
  });
});
