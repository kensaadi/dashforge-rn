import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { ActivityIndicator, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { IconButton } from './IconButton';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

/** A stand-in for whatever icon set the consumer brought. */
const Glyph = ({ size, color }: { size?: number; color?: string }) => (
  <View testID="glyph" style={{ width: size, height: size, backgroundColor: color }} />
);

const TOKENS = defaultComponentTokens(semanticLight).IconButton.tokens;
const button = () => screen.getByRole('button');
const box = () => flat(button().props.style);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('the label it cannot do without', () => {
  it('warns when it has none, because it would announce only "button"', () => {
    render(<IconButton icon={Glyph} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('the affordance, not the name'));
  });

  it('says nothing when it has one', () => {
    render(<IconButton icon={Glyph} accessibilityLabel="Elimina" />);
    expect(warn).not.toHaveBeenCalled();
    expect(button().props.accessibilityLabel).toBe('Elimina');
  });
});

describe('the icon', () => {
  it('is sized and coloured by the button, not by the caller', () => {
    render(<IconButton icon={Glyph} accessibilityLabel="X" />);
    const glyph = flat(screen.getByTestId('glyph').props.style);
    expect(glyph.width).toBe(TOKENS.iconSize.md);
    expect(glyph.backgroundColor).toBeTruthy();
  });

  it.each(['sm', 'md', 'lg'] as const)('follows the size: %s', (size) => {
    render(<IconButton icon={Glyph} size={size} accessibilityLabel="X" />);
    expect(flat(screen.getByTestId('glyph').props.style).width).toBe(TOKENS.iconSize[size]);
    expect(box().width).toBe(TOKENS.size[size]);
    // The box is small on purpose; the target around it is not.
    expect(button().props.hitSlop).toBe(TOKENS.hitSlop[size]);
  });

  it('is square, so the glyph sits in a shape and not in a rectangle', () => {
    render(<IconButton icon={Glyph} accessibilityLabel="X" />);
    expect(box().width).toBe(box().height);
  });
});

describe('shape', () => {
  it('rounds the corners by default', () => {
    render(<IconButton icon={Glyph} accessibilityLabel="X" />);
    expect(box().borderRadius).toBe(TOKENS.radius);
  });

  it('is a circle when asked, at half of whatever it is wide', () => {
    render(<IconButton icon={Glyph} shape="circle" size="lg" accessibilityLabel="X" />);
    expect(box().borderRadius).toBe(TOKENS.size.lg / 2);
  });
});

describe('variants', () => {
  it('is ghost by default, because a toolbar of filled circles is a wall', () => {
    render(<IconButton icon={Glyph} accessibilityLabel="X" />);
    expect(box().backgroundColor).toBe('transparent');
    expect(box().borderWidth).toBe(0);
  });

  it('fills when solid', () => {
    render(<IconButton icon={Glyph} variant="solid" color="primary" accessibilityLabel="X" />);
    expect(box().backgroundColor).toBe(TOKENS.role.primary.bg);
  });

  it('draws an edge when outlined', () => {
    render(<IconButton icon={Glyph} variant="outline" color="danger" accessibilityLabel="X" />);
    expect(box().borderWidth).toBe(TOKENS.borderWidth);
    expect(box().borderColor).toBe(TOKENS.role.danger.border);
  });
});

describe('loading', () => {
  it('replaces the icon with a spinner', () => {
    render(<IconButton icon={Glyph} loading accessibilityLabel="Salva" />);
    expect(screen.queryByTestId('glyph')).toBeNull();
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('is inert and says it is busy rather than unavailable', () => {
    const onPress = jest.fn();
    render(<IconButton icon={Glyph} loading onPress={onPress} accessibilityLabel="Salva" />);
    fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(button().props.accessibilityState.busy).toBe(true);
  });

  it('keeps its colour while busy, since dimming would say "you cannot"', () => {
    render(
      <IconButton icon={Glyph} loading variant="solid" color="primary" accessibilityLabel="X" />,
    );
    // The rest fill, not the disabled one: waiting is a different message
    // from being unavailable.
    expect(box().backgroundColor).toBe(TOKENS.role.primary.bg);
  });
});

describe('disabled', () => {
  it('does not press', () => {
    const onPress = jest.fn();
    render(<IconButton icon={Glyph} disabled onPress={onPress} accessibilityLabel="X" />);
    fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(button().props.accessibilityState.disabled).toBe(true);
  });

  it('takes the disabled fill, which loading does not', () => {
    render(
      <IconButton icon={Glyph} disabled variant="solid" color="primary" accessibilityLabel="X" />,
    );
    expect(box().backgroundColor).toBe(TOKENS.role.primary.bgDisabled);
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [
      { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
      { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
    ],
  };

  const as = (roles: string[], ui: React.ReactElement) =>
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles }}>
        {ui}
      </RbacProvider>,
    );

  it('hides by default when denied', () => {
    as(
      ['viewer'],
      <IconButton
        icon={Glyph}
        accessibilityLabel="Elimina"
        access={{ resource: 'invoice', action: 'delete' }}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('collapses readonly into disabled, as a button with no value must', () => {
    const onPress = jest.fn();
    as(
      ['viewer'],
      <IconButton
        icon={Glyph}
        onPress={onPress}
        accessibilityLabel="Elimina"
        access={{ resource: 'invoice', action: 'delete', onUnauthorized: 'readonly' }}
      />,
    );
    fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
  });

  it('honours visibleWhen', () => {
    render(<IconButton icon={Glyph} accessibilityLabel="X" visibleWhen={() => false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

void Text;
