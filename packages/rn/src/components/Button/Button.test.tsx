import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { patchTheme, setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { Button } from './Button';

const flat = (style: unknown) =>
  Array.isArray(style) ? Object.assign({}, ...style.flat(9).filter(Boolean)) : style;

beforeEach(() => {
  setMode('light');
  // The whole Button slice, not just `defaults`. `patchTheme` is a deep
  // merge into a living store, so a token a test writes survives into
  // every test after it: putting the shipped ones back is the only
  // reset there is.
  // Per mode, and not `'both'`: each mode has its own component tokens
  // because they are built from its own semantic layer, so restoring the
  // light ones into the dark theme would make dark mode look like light
  // mode and the test that checks it would be checking nothing.
  for (const [mode, semantic] of [
    ['light', semanticLight],
    ['dark', semanticDark],
  ] as const) {
    patchTheme(
      {
        components: {
          Button: {
            defaults: {},
            tokens: defaultComponentTokens(semantic).Button.tokens,
          },
        },
      } as never,
      mode,
    );
  }
});

describe('Button', () => {
  it('renders a bare string safely', () => {
    render(<Button>Salva</Button>);
    expect(screen.getByText('Salva')).toBeTruthy();
  });

  it('is announced as a button', () => {
    render(<Button>Salva</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Salva</Button>);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('disabled', () => {
    it('does not fire', () => {
      const onPress = jest.fn();
      render(
        <Button disabled onPress={onPress}>
          Salva
        </Button>,
      );
      fireEvent.press(screen.getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('says so to assistive technology', () => {
      render(<Button disabled>Salva</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('mutes the label rather than the fill', () => {
      render(<Button disabled>Salva</Button>);
      expect(flat(screen.getByText('Salva').props.style).color).toBe(
        semanticLight.action.primary.fgDisabled,
      );
    });
  });

  describe('loading', () => {
    it('blocks the press', () => {
      const onPress = jest.fn();
      render(
        <Button loading onPress={onPress}>
          Salva
        </Button>,
      );
      fireEvent.press(screen.getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('announces itself as busy, not as unavailable', () => {
      render(<Button loading>Salva</Button>);
      expect(screen.getByRole('button').props.accessibilityState.busy).toBe(true);
    });

    it('keeps the full colour: busy is not the same message as disabled', () => {
      render(<Button loading>Salva</Button>);
      expect(flat(screen.getByText('Salva').props.style).color).toBe(
        semanticLight.action.primary.fg,
      );
    });

    it('replaces the leading icon instead of adding to it', () => {
      const Icon = () => <Text>ICON</Text>;
      render(
        <Button loading startIcon={Icon}>
          Salva
        </Button>,
      );
      expect(screen.queryByText('ICON')).toBeNull();
    });
  });

  describe('icons', () => {
    it('renders both sides', () => {
      const Start = () => <Text>S</Text>;
      const End = () => <Text>E</Text>;
      render(
        <Button startIcon={Start} endIcon={End}>
          Salva
        </Button>,
      );
      expect(screen.getByText('S')).toBeTruthy();
      expect(screen.getByText('E')).toBeTruthy();
    });
  });

  describe('tokens', () => {
    it('takes its resting fill from the action role', () => {
      render(<Button color="danger">Elimina</Button>);
      expect(flat(screen.getByRole('button').props.style).backgroundColor).toBe(
        semanticLight.action.danger.bg,
      );
    });

    it('follows a theme override without touching the component', () => {
      patchTheme({
        components: { Button: { tokens: { radius: { md: 0 } } } },
      } as never);
      render(<Button>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).borderRadius).toBe(0);
    });

    it('follows a theme default for a variant prop', () => {
      patchTheme({ components: { Button: { defaults: { size: 'lg' } } } } as never);
      render(<Button>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).minHeight).toBe(
        semanticLight.control.minHeight.lg,
      );
    });

    it('lets an explicit prop win over the theme default', () => {
      patchTheme({ components: { Button: { defaults: { size: 'lg' } } } } as never);
      render(<Button size="sm">Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).minHeight).toBe(
        semanticLight.control.minHeight.sm,
      );
    });

    it('clears the 44pt floor at the small size through hitSlop', () => {
      render(<Button size="sm">Salva</Button>);
      const slop = screen.getByRole('button').props.hitSlop as number;
      expect(semanticLight.control.minHeight.sm + slop * 2).toBeGreaterThanOrEqual(44);
    });
  });

  describe('fullWidth', () => {
    it('stretches when asked', () => {
      render(<Button fullWidth>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).alignSelf).toBe('stretch');
    });

    it('does not stretch by default, whatever the parent wants', () => {
      // React Native stretches a column child unless told otherwise, so
      // the false case has to be explicit. Verified on device before it
      // was verified here.
      render(<Button>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).alignSelf).toBe('flex-start');
    });
  });

  describe('sx', () => {
    it('wins over the variant style', () => {
      render(<Button sx={{ backgroundColor: '#ff0000' }}>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).backgroundColor).toBe(
        '#ff0000',
      );
    });

    it('accepts the function form and sees the interaction state', () => {
      render(
        <Button sx={({ disabled }) => ({ opacity: disabled ? 0.1 : 1 })} disabled>
          Salva
        </Button>,
      );
      expect(flat(screen.getByRole('button').props.style).opacity).toBe(0.1);
    });
  });

  describe('dark mode', () => {
    it('changes appearance without the component knowing a mode exists', () => {
      // Checked on a neutral role. The primary brand fill deliberately
      // does *not* move between modes: on a tone axis, 600 is the
      // lightest step that carries a white label in either one. What
      // inverts is everything around it.
      const { rerender } = render(<Button color="secondary">Annulla</Button>);
      const light = flat(screen.getByRole('button').props.style).backgroundColor;
      setMode('dark');
      rerender(<Button color="secondary">Annulla</Button>);
      expect(flat(screen.getByRole('button').props.style).backgroundColor).not.toBe(
        light,
      );
    });

    it('keeps the brand fill on the step that carries its label', () => {
      const { rerender } = render(<Button>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).backgroundColor).toBe(
        semanticLight.action.primary.bg,
      );
      setMode('dark');
      rerender(<Button>Salva</Button>);
      expect(flat(screen.getByRole('button').props.style).backgroundColor).toBe(
        semanticDark.action.primary.bg,
      );
    });
  });
});

describe('radius', () => {
  const TOKENS = defaultComponentTokens(semanticLight).Button.tokens;
  const box = () => flat(screen.getByRole('button').props.style);

  it('is the control step by default', () => {
    render(<Button>X</Button>);
    expect(box().borderRadius).toBe(TOKENS.radius.md);
  });

  it.each(['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as const)(
    'takes the %s step',
    (step) => {
      render(<Button radius={step}>X</Button>);
      expect(box().borderRadius).toBe(TOKENS.radius[step]);
    },
  );

  it('squares off at none and pills at full', () => {
    // The two ends of the scale, which are the reason it exists: a
    // square button and a pill without either being a number at the call
    // site.
    render(<Button testID="square" radius="none">X</Button>);
    expect(flat(screen.getByTestId('square').props.style).borderRadius).toBe(0);

    render(<Button testID="pill" radius="full">X</Button>);
    expect(flat(screen.getByTestId('pill').props.style).borderRadius).toBeGreaterThan(100);
  });

  it('follows the scale from the theme, so an app changes it once', () => {
    patchTheme({
      components: { Button: { tokens: { radius: { md: 2 } } } },
    } as never);
    render(<Button>X</Button>);
    expect(box().borderRadius).toBe(2);
  });
});
