import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Image, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { Card } from './Card';
import { cardRecipe } from './card.variants';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const rootStyle = (testID = 'card') => flat(screen.getByTestId(testID).props.style);

beforeEach(() => setMode('light'));

describe('variants', () => {
  it('draws an edge and no shadow by default', () => {
    render(<Card testID="card">
      <Text>x</Text>
    </Card>);
    const s = rootStyle();
    expect(s.borderWidth).toBe(1);
    expect(s.shadowOpacity).toBeUndefined();
    expect(s.elevation).toBeUndefined();
  });

  it('casts a shadow instead of drawing an edge when elevated', () => {
    render(<Card testID="card" variant="elevated">
      <Text>x</Text>
    </Card>);
    const s = rootStyle();
    expect(s.borderWidth).toBeUndefined();
    // One token, both platforms: iOS reads the shadow fields, Android
    // reads `elevation`. A card that only carried one would be flat on
    // the other platform, which is the mistake this asserts against.
    expect(s.shadowOpacity).toBeGreaterThan(0);
    expect(s.shadowRadius).toBeGreaterThan(0);
    expect(s.shadowOffset).toEqual({ width: 0, height: 1 });
    expect(s.elevation).toBeGreaterThan(0);
  });

  it('carries a stronger shadow in dark mode, where shadows barely read', () => {
    render(<Card testID="card" variant="elevated">
      <Text>x</Text>
    </Card>);
    const light = rootStyle().shadowOpacity as number;

    setMode('dark');
    render(<Card testID="dark" variant="elevated">
      <Text>x</Text>
    </Card>);
    expect(rootStyle('dark').shadowOpacity as number).toBeGreaterThan(light);
  });

  it('changes ground rather than adding an edge when filled', () => {
    render(<Card testID="card" variant="filled">
      <Text>x</Text>
    </Card>);
    const s = rootStyle();
    expect(s.borderWidth).toBeUndefined();
    expect(s.elevation).toBeUndefined();
    expect(s.backgroundColor).toBeTruthy();
  });

  it('is a column with a gap, because that is what every hand-built card was', () => {
    render(<Card testID="card">
      <Text>x</Text>
    </Card>);
    const s = rootStyle();
    expect(s.flexDirection).toBe('column');
    expect(s.gap).toBeGreaterThan(0);
  });
});

describe('padding', () => {
  it.each([
    ['none', 0],
    ['sm', 12],
    ['md', 16],
    ['lg', 24],
  ] as const)('%s', (padding, expected) => {
    render(<Card testID="card" padding={padding}>
      <Text>x</Text>
    </Card>);
    expect(rootStyle().padding).toBe(expected);
  });
});

describe('pressable', () => {
  it('is not a button when it has nothing to do', () => {
    render(<Card testID="card">
      <Text>x</Text>
    </Card>);
    expect(screen.getByTestId('card').props.accessibilityRole).toBeUndefined();
  });

  it('becomes one when given an onPress', () => {
    const onPress = jest.fn();
    render(<Card testID="card" onPress={onPress}>
      <Text>x</Text>
    </Card>);

    expect(screen.getByTestId('card').props.accessibilityRole).toBe('button');
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalled();
  });

  it('is inert and dimmed when disabled', () => {
    const onPress = jest.fn();
    render(<Card testID="card" onPress={onPress} disabled>
      <Text>x</Text>
    </Card>);

    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).not.toHaveBeenCalled();
    expect(rootStyle().opacity).toBeLessThan(1);
    expect(screen.getByTestId('card').props.accessibilityState.disabled).toBe(true);
  });
});

describe('header', () => {
  it('announces a string title as a heading', () => {
    render(
      <Card>
        <Card.Header title="Ordini" subtitle="Ultimi 30 giorni" />
      </Card>,
    );
    expect(screen.getByText('Ordini').props.accessibilityRole).toBe('header');
    expect(screen.getByText('Ultimi 30 giorni')).toBeTruthy();
  });

  it('leaves a node title alone, because the caller took the decision over', () => {
    render(
      <Card>
        <Card.Header title={<Text testID="own">Mio</Text>} />
      </Card>,
    );
    expect(screen.getByTestId('own').props.accessibilityRole).toBeUndefined();
  });

  it('places the action beside the text block', () => {
    render(
      <Card>
        <Card.Header title="Fattura" action={<View testID="action" />} />
      </Card>,
    );
    expect(screen.getByTestId('action')).toBeTruthy();
  });

  it('keeps the action at the top so it does not drift on a wrapped title', () => {
    render(
      <Card>
        <Card.Header testID="header" title="Fattura" action={<View />} />
      </Card>,
    );
    const s = flat(screen.getByTestId('header').props.style);
    expect(s.flexDirection).toBe('row');
    expect(s.alignItems).toBe('flex-start');
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

  it('hides the card and everything in it when denied', () => {
    as(
      ['viewer'],
      <Card access={{ resource: 'invoice', action: 'delete' }}>
        <Text>riservato</Text>
      </Card>,
    );
    expect(screen.queryByText('riservato')).toBeNull();
  });

  it('makes a pressable card inert under disable', () => {
    const onPress = jest.fn();
    as(
      ['viewer'],
      <Card
        testID="card"
        onPress={onPress}
        access={{ resource: 'invoice', action: 'delete', onUnauthorized: 'disable' }}
      >
        <Text>x</Text>
      </Card>,
    );
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('honours visibleWhen', () => {
    render(
      <Card visibleWhen={() => false}>
        <Text>nascosto</Text>
      </Card>,
    );
    expect(screen.queryByText('nascosto')).toBeNull();
  });
});

describe('the pressed ground', () => {
  /**
   * Asserted on the recipe rather than through a press, because this is a
   * decision about tokens and not about plumbing: `pressed` is React
   * Native's own state and there is nothing of ours between it and the
   * style.
   *
   * The risk being covered is that a pressed colour with a fixed
   * direction is invisible in one of the two modes. `surface.sunken` is
   * darker than a white card in light and lighter than a near-black one
   * in dark, which is the only reason it works for both. Testing light
   * alone would have looked perfectly fine.
   */
  const groundsFor = (semantic: typeof semanticLight) => {
    const tokens = defaultComponentTokens(semantic).Card.tokens;
    const resolve = cardRecipe(tokens);
    return (variant: 'outlined' | 'elevated' | 'filled') => ({
      rest: resolve({ variant, pressed: false }).root.backgroundColor,
      pressed: resolve({ variant, pressed: true }).root.backgroundColor,
    });
  };

  it.each(['outlined', 'elevated', 'filled'] as const)(
    'moves under the finger in light mode: %s',
    (variant) => {
      const { rest, pressed } = groundsFor(semanticLight)(variant);
      expect(pressed).toBeTruthy();
      expect(pressed).not.toBe(rest);
    },
  );

  it.each(['outlined', 'elevated', 'filled'] as const)(
    'moves under the finger in dark mode: %s',
    (variant) => {
      const { rest, pressed } = groundsFor(semanticDark)(variant);
      expect(pressed).toBeTruthy();
      expect(pressed).not.toBe(rest);
    },
  );

  /**
   * The same collision one level out, and the one the screenshots caught
   * rather than the tests: with `filled` on the fill scale, a filled card
   * nested in an ordinary one vanished in dark mode, because
   * `fill.subtle` and `surface.raised` are the same value there. Light
   * mode looked correct throughout.
   */
  it.each([
    ['light', semanticLight],
    ['dark', semanticDark],
  ] as const)('separates a filled card from an ordinary one in %s mode', (_, semantic) => {
    const grounds = groundsFor(semantic);
    expect(grounds('filled').rest).not.toBe(grounds('outlined').rest);
    expect(grounds('filled').rest).not.toBe(grounds('elevated').rest);
  });
});

describe('tone', () => {
  const groundsFor = (semantic: typeof semanticLight) => {
    const tokens = defaultComponentTokens(semantic).Card.tokens;
    return cardRecipe(tokens);
  };

  it('tints the ground and takes the text with it', () => {
    render(
      <Card testID="card" tone="warning">
        <Card.Header title="Attenzione" />
      </Card>,
    );
    const neutral = groundsFor(semanticLight)({ tone: 'neutral' });
    const warning = groundsFor(semanticLight)({ tone: 'warning' });

    expect(rootStyle().backgroundColor).toBe(warning.root.backgroundColor);
    expect(warning.root.backgroundColor).not.toBe(neutral.root.backgroundColor);
    // The text moves with the ground: muted neutral on a tint is muddy,
    // and worse, its contrast was never checked against that ground.
    expect(warning.title.color).not.toBe(neutral.title.color);
    expect(warning.subtitle.color).toBe(warning.title.color);
  });

  it('reaches the header, which is the thing that draws the text', () => {
    // Asserted on what is rendered and not only on the recipe: the header
    // is a separate component and learns the tone from the card through
    // context. Testing the recipe alone missed that it never asked.
    render(
      <Card tone="danger">
        <Card.Header title="Errore" subtitle="Riprova" />
      </Card>,
    );
    const expected = groundsFor(semanticLight)({ tone: 'danger' }).title.color;
    expect(flat(screen.getByText('Errore').props.style).color).toBe(expected);
    expect(flat(screen.getByText('Riprova').props.style).color).toBe(expected);
  });

  it('leaves the variant to decide whether there is an edge at all', () => {
    render(
      <Card testID="outlined" tone="danger" variant="outlined">
        <Text>x</Text>
      </Card>,
    );
    expect(rootStyle('outlined').borderWidth).toBe(1);

    render(
      <Card testID="filled" tone="danger" variant="filled">
        <Text>x</Text>
      </Card>,
    );
    expect(rootStyle('filled').borderWidth).toBeUndefined();
  });

  it.each([
    ['light', semanticLight],
    ['dark', semanticDark],
  ] as const)('still moves under the finger in %s mode', (_, semantic) => {
    const resolve = groundsFor(semantic);
    for (const tone of ['success', 'warning', 'danger', 'info'] as const) {
      const rest = resolve({ tone, pressed: false }).root.backgroundColor;
      const pressed = resolve({ tone, pressed: true }).root.backgroundColor;
      expect(pressed).toBeTruthy();
      expect(pressed).not.toBe(rest);
    }
  });
});

describe('media', () => {
  const source = { uri: 'https://example.test/p.jpg' };
  const mediaStyle = () => flat(screen.UNSAFE_getByType(Image).props.style);

  it('bleeds past the card padding, because a band that stopped inside is not a band', () => {
    render(
      <Card padding="md">
        <Card.Media source={source} />
      </Card>,
    );
    const s = mediaStyle();
    expect(s.marginHorizontal).toBe(-16);
    expect(s.marginTop).toBe(-16);
  });

  it('follows the card padding rather than a number of its own', () => {
    render(
      <Card padding="lg">
        <Card.Media source={source} />
      </Card>,
    );
    expect(mediaStyle().marginHorizontal).toBe(-24);
  });

  it('adds no margin at all inside a card with no padding', () => {
    render(
      <Card padding="none">
        <Card.Media source={source} />
      </Card>,
    );
    expect(mediaStyle().marginHorizontal).toBe(-0);
  });

  it('rounds only the corners it meets, less the border', () => {
    render(
      <Card padding="md">
        <Card.Media source={source} />
      </Card>,
    );
    const s = mediaStyle();
    // The card's radius less its border: an inner curve equal to the
    // outer one reads as two curves that disagree.
    expect(s.borderTopLeftRadius).toBe(11);
    expect(s.borderBottomLeftRadius).toBeUndefined();
  });

  it('stays put when it is not the first child', () => {
    render(
      <Card padding="md">
        <Text>sopra</Text>
        <Card.Media source={source} flush="none" />
      </Card>,
    );
    const s = mediaStyle();
    // Horizontal bleed either way; a negative top margin here would pull
    // the band over whatever is above it.
    expect(s.marginHorizontal).toBe(-16);
    expect(s.marginTop).toBe(0);
    expect(s.borderTopLeftRadius).toBe(0);
  });

  it('keeps its proportions instead of taking a height', () => {
    render(
      <Card>
        <Card.Media source={source} />
      </Card>,
    );
    const s = mediaStyle();
    expect(s.aspectRatio).toBeCloseTo(16 / 9);
    expect(s.height).toBeUndefined();
  });

  it('takes a height when a ratio cannot say it', () => {
    render(
      <Card>
        <Card.Media source={source} height={80} />
      </Card>,
    );
    const s = mediaStyle();
    expect(s.height).toBe(80);
    expect(s.aspectRatio).toBeUndefined();
  });

  it('is decoration until it is given something to say', () => {
    render(
      <Card>
        <Card.Media source={source} />
      </Card>,
    );
    expect(screen.UNSAFE_getByType(Image).props.accessible).toBe(false);
  });

  it('is announced once it has', () => {
    render(
      <Card>
        <Card.Media source={source} accessibilityLabel="Il prodotto, di profilo" />
      </Card>,
    );
    const img = screen.UNSAFE_getByType(Image);
    expect(img.props.accessible).toBe(true);
    expect(img.props.accessibilityLabel).toBe('Il prodotto, di profilo');
  });
});
