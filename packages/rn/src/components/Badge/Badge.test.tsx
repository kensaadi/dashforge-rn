import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { Badge } from './Badge';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Badge.tokens;

/** Hidden from the reader unless it was given a label, so ask for it. */
const root = () => screen.getByTestId('badge', { includeHiddenElements: true });
const rootStyle = () => flat(root().props.style);
const label = () => screen.getByText(/./, { includeHiddenElements: true });

beforeEach(() => setMode('light'));

describe('what it says', () => {
  it('says the label it was given', () => {
    render(<Badge testID="badge">Nuovo</Badge>);
    expect(screen.getByText('Nuovo', { includeHiddenElements: true })).toBeTruthy();
  });

  it('says the count instead, when it has one', () => {
    render(<Badge testID="badge" count={12}>Nuovo</Badge>);
    expect(label().props.children).toBe('12');
  });

  it('stops counting past the cap', () => {
    render(<Badge testID="badge" count={140} />);
    expect(label().props.children).toBe('99+');
  });

  it('takes the cap from the caller', () => {
    render(<Badge testID="badge" count={12} max={9} />);
    expect(label().props.children).toBe('9+');
  });

  it('says exactly the cap without a plus', () => {
    render(<Badge testID="badge" count={99} />);
    expect(label().props.children).toBe('99');
  });

  it('says nothing at all as a dot, whatever else it was given', () => {
    render(<Badge testID="badge" dot count={12}>Nuovo</Badge>);
    expect(screen.queryByText('12', { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByText('Nuovo', { includeHiddenElements: true })).toBeNull();
    expect(rootStyle().width).toBe(TOKENS.dotSize);
    expect(rootStyle().height).toBe(TOKENS.dotSize);
  });

  it('leaves a node alone', () => {
    render(
      <Badge testID="badge">
        <Text testID="own">Nuovo</Text>
      </Badge>,
    );
    expect(screen.getByTestId('own', { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('the colour', () => {
  it('fills with the role and puts its own foreground on it', () => {
    render(<Badge testID="badge" color="danger" count={3} />);
    expect(rootStyle().backgroundColor).toBe(semanticLight.action.danger.bg);
    expect(flat(label().props.style).color).toBe(semanticLight.action.danger.fg);
  });

  it('tints instead of filling when it is soft', () => {
    render(<Badge testID="badge" color="danger" variant="soft" count={3} />);
    expect(rootStyle().backgroundColor).toBe(semanticLight.feedback.danger.bg);
    expect(flat(label().props.style).color).toBe(semanticLight.feedback.danger.fg);
  });

  it('keeps a soft neutral visible on a card in dark, which subtle would not', () => {
    // `fill.subtle` and `surface.raised` are the same value in dark, so a
    // neutral badge tinted with subtle would vanish on a card.
    setMode('dark');
    render(<Badge testID="badge" color="secondary" variant="soft" count={3} />);
    expect(rootStyle().backgroundColor).toBe(semanticDark.fill.default);
    expect(rootStyle().backgroundColor).not.toBe(semanticDark.surface.raised);
  });
});

describe('the shape', () => {
  it('is a pill wide enough for one digit to be a disc', () => {
    render(<Badge testID="badge" count={3} />);
    expect(rootStyle().minWidth).toBe(TOKENS.minWidth);
    expect(rootStyle().height).toBe(TOKENS.height);
    expect(rootStyle().borderRadius).toBe(TOKENS.radius);
  });

  it('does not stretch to whatever it was put in', () => {
    render(<Badge testID="badge" count={3} />);
    expect(rootStyle().alignSelf).toBe('flex-start');
  });
});

describe('what it tells a screen reader', () => {
  it('is silent without a label, because a bare number is noise', () => {
    render(<Badge testID="badge" count={3} />);
    expect(root().props.accessible).toBe(false);
    expect(root().props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('says the label it was given instead of its own digits', () => {
    render(<Badge testID="badge" count={3} accessibilityLabel="3 messaggi non letti" />);
    expect(root().props.accessibilityLabel).toBe('3 messaggi non letti');
    expect(root().props.accessible).toBe(true);
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(<Badge testID="badge" count={3} visibleWhen={() => false} />);
    expect(screen.queryByTestId('badge', { includeHiddenElements: true })).toBeNull();
  });
});
