import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Chip } from './Chip';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Chip.tokens;
const chip = () => screen.getByLabelText('Milano');
const chipStyle = () => flat(chip().props.style);

beforeEach(() => setMode('light'));

describe('what it says it is', () => {
  it('is text when nothing about it is pressable', () => {
    // A button that does nothing is worse than a label.
    render(<Chip label="Milano" />);
    expect(chip().props.accessibilityRole).toBeUndefined();
    expect(chip().props.accessible).toBe(true);
  });

  it('is a button when it only acts', () => {
    render(<Chip label="Milano" onPress={jest.fn()} />);
    expect(chip().props.accessibilityRole).toBe('button');
  });

  it('is a switch when it has an on and an off', () => {
    // A reader needs to hear which, and "button" does not say.
    render(<Chip label="Milano" selected onPress={jest.fn()} />);
    expect(chip().props.accessibilityRole).toBe('switch');
    expect(chip().props.accessibilityState.checked).toBe(true);
  });

  it('reads the name it was given instead of its word', () => {
    render(<Chip label="MI" accessibilityLabel="Milano" onPress={jest.fn()} />);
    expect(screen.getByLabelText('Milano')).toBeTruthy();
  });
});

describe('the two states', () => {
  it('is an outline until it is chosen', () => {
    render(<Chip label="Milano" onPress={jest.fn()} />);
    expect(chipStyle().backgroundColor).toBe('transparent');
    expect(chipStyle().borderColor).toBe(semanticLight.border.default);
  });

  it("takes the role's own fill once it is", () => {
    render(<Chip label="Milano" selected onPress={jest.fn()} />);
    expect(chipStyle().backgroundColor).toBe(semanticLight.action.primary.bg);
    expect(flat(screen.getByText('Milano').props.style).color).toBe(
      semanticLight.action.primary.fg,
    );
  });

  it('takes the role it was asked for', () => {
    render(<Chip label="Milano" selected color="danger" onPress={jest.fn()} />);
    expect(chipStyle().backgroundColor).toBe(semanticLight.action.danger.bg);
  });
});

describe('the cross', () => {
  const cross = () => screen.getByLabelText('Rimuovi Milano');

  it('is not there unless there is something to remove', () => {
    render(<Chip label="Milano" onPress={jest.fn()} />);
    expect(screen.queryByLabelText(/Rimuovi/)).toBeNull();
  });

  it("is a target of its own, with the chip's own word in its name", () => {
    // Eleven chips announcing "Remove" eleven times is a list nobody can
    // use.
    render(<Chip label="Milano" onRemove={jest.fn()} />);
    expect(cross().props.accessibilityRole).toBe('button');
  });

  it('takes the name the caller wrote', () => {
    render(<Chip label="Milano" onRemove={jest.fn()} removeLabel="Togli la città" />);
    expect(screen.getByLabelText('Togli la città')).toBeTruthy();
  });

  it('removes without choosing', () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    render(<Chip label="Milano" onPress={onPress} onRemove={onRemove} />);
    fireEvent.press(cross());
    expect(onRemove).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is two arms of one cross, drawn from views', () => {
    // This package ships no icon set and imports no drawing library.
    render(<Chip label="Milano" onRemove={jest.fn()} />);
    const arms = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .filter((s) => s.height === TOKENS.remove.thickness);
    expect(arms).toHaveLength(2);
  });
});

describe('being inert', () => {
  it('does not act, and is dimmed', () => {
    const onPress = jest.fn();
    render(<Chip label="Milano" onPress={onPress} disabled />);
    fireEvent.press(chip());
    expect(onPress).not.toHaveBeenCalled();
    expect(chipStyle().opacity).toBe(semanticLight.opacity.disabled);
  });

  it('takes the cross with it', () => {
    const onRemove = jest.fn();
    render(<Chip label="Milano" onRemove={onRemove} disabled />);
    fireEvent.press(screen.getByLabelText('Rimuovi Milano'));
    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe('the shape', () => {
  it('is a pill, which says one of several small things', () => {
    render(<Chip label="Milano" onPress={jest.fn()} />);
    expect(chipStyle().borderRadius).toBe(TOKENS.radius.full);
  });

  it('takes a step off the radius scale when asked', () => {
    render(<Chip label="Milano" radius="sm" onPress={jest.fn()} />);
    expect(chipStyle().borderRadius).toBe(TOKENS.radius.sm);
  });

  it('states a floor and never a height', () => {
    render(<Chip label="Milano" size="lg" onPress={jest.fn()} />);
    expect(chipStyle().minHeight).toBe(TOKENS.height.lg);
    expect(chipStyle().height).toBeUndefined();
  });

  it('does not stretch to whatever it was put in', () => {
    render(<Chip label="Milano" onPress={jest.fn()} />);
    expect(chipStyle().alignSelf).toBe('flex-start');
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'filter', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<Chip label="Milano" visibleWhen={() => false} />);
    expect(screen.queryByLabelText('Milano')).toBeNull();
  });

  it('is gone when access hides it', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Chip label="Milano" access={{ resource: 'filter', action: 'write' }} />
      </RbacProvider>,
    );
    expect(screen.queryByLabelText('Milano')).toBeNull();
  });

  it('is inert when access disables it', () => {
    const onPress = jest.fn();
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Chip
          label="Milano"
          onPress={onPress}
          access={{ resource: 'filter', action: 'write', onUnauthorized: 'disable' }}
        />
      </RbacProvider>,
    );
    fireEvent.press(chip());
    expect(onPress).not.toHaveBeenCalled();
  });
});
