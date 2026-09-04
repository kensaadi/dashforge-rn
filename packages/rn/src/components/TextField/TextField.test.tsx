import { useState } from 'react';
import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { semanticLight } from '../../tokens/semantic';
import { TextField } from './TextField';

const flat = (style: unknown) =>
  Array.isArray(style) ? Object.assign({}, ...style.flat(9).filter(Boolean)) : style;

const input = () => screen.UNSAFE_getByType(require('react-native').TextInput);

beforeEach(() => setMode('light'));

describe('standalone', () => {
  it('renders a label and a placeholder', () => {
    render(<TextField label="Email" placeholder="tu@esempio.it" />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('tu@esempio.it')).toBeTruthy();
  });

  it('reports typing through onChangeText', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Nome" onChangeText={onChangeText} />);
    fireEvent.changeText(input(), 'Maria');
    expect(onChangeText).toHaveBeenCalledWith('Maria');
  });

  it('works as a controlled input', () => {
    function Host() {
      const [v, setV] = useState('a');
      return <TextField label="X" value={v} onChangeText={setV} />;
    }
    render(<Host />);
    fireEvent.changeText(input(), 'ab');
    expect(input().props.value).toBe('ab');
  });

  it('neutralises the platform underline Android draws for itself', () => {
    // Step zero of every component: the OS must not be styling this.
    render(<TextField />);
    expect(input().props.underlineColorAndroid).toBe('transparent');
  });

  it('zeroes the input own padding, because the control owns the spacing', () => {
    render(<TextField />);
    expect(flat(input().props.style).padding).toBe(0);
  });

  it('removes the font padding Android adds asymmetrically', () => {
    render(<TextField />);
    expect(flat(input().props.style).includeFontPadding).toBe(false);
  });

  describe('vertical centring', () => {
    it('sets no line height on a single-line input', () => {
      // iOS reserves the line height but draws the glyphs at the top of
      // it, so an explicit value leaves the text sitting high with the
      // caret hanging below. Centring the row does not help: what gets
      // centred is the line box, not the glyphs. Found by looking at a
      // simulator, not by a test.
      render(<TextField />);
      expect(flat(input().props.style).lineHeight).toBeUndefined();
      expect(input().props.textAlignVertical).toBe('center');
    });

    it('puts it back for multiline, where it means what it is for', () => {
      render(<TextField multiline />);
      expect(flat(input().props.style).lineHeight).toBeGreaterThan(0);
      expect(input().props.textAlignVertical).toBe('top');
    });
  });
});

describe('validation', () => {
  it('shows helper text when there is no error', () => {
    render(<TextField label="Email" helperText="Useremo questo indirizzo" />);
    expect(screen.getByText('Useremo questo indirizzo')).toBeTruthy();
  });

  it('colours the border when explicitly invalid', () => {
    render(<TextField error helperText="Non valida" />);
    const control = screen.getByText('Non valida').parent;
    expect(control).toBeTruthy();
    expect(screen.getByText('Non valida')).toBeTruthy();
  });

  it('announces the message rather than only colouring the border', () => {
    // A red border says nothing to a screen reader, and nothing at all
    // to someone who cannot separate red from grey.
    render(<TextField error helperText="Non valida" />);
    expect(input().props.accessibilityHint).toBe('Non valida');
  });

  it('says nothing to assistive tech when valid', () => {
    render(<TextField helperText="Useremo questo indirizzo" />);
    expect(input().props.accessibilityHint).toBeUndefined();
  });
});

describe('disabled and readonly', () => {
  it('cannot be edited when disabled', () => {
    render(<TextField disabled />);
    expect(input().props.editable).toBe(false);
  });

  it('says so to assistive tech', () => {
    render(<TextField disabled />);
    expect(input().props.accessibilityState.disabled).toBe(true);
  });

  it('greys the label', () => {
    render(<TextField label="Email" disabled />);
    expect(flat(screen.getByText('Email').props.style).color).toBe(
      semanticLight.text.disabled,
    );
  });

  it('outranks invalid, because there is nothing to correct', () => {
    render(<TextField label="Email" disabled error helperText="Non valida" />);
    expect(flat(screen.getByText('Non valida').props.style).color).toBe(
      semanticLight.text.muted,
    );
  });
});

describe('form mode', () => {
  // `DashFormProvider`, not `DashForm`. The latter is the provider plus a
  // `<form>` element, which exists only for the browser's native submit
  // and is a host component React Native does not have. See
  // ARCHITECTURE.md section 1.
  const wrap = (ui: React.ReactElement) =>
    render(<DashFormProvider>{ui}</DashFormProvider>);

  it('registers and takes its value from the engine', () => {
    wrap(<TextField name="email" label="Email" />);
    fireEvent.changeText(input(), 'a@b.it');
    expect(input().props.value).toBe('a@b.it');
  });

  it('still calls the consumer callback', () => {
    const onChangeText = jest.fn();
    wrap(<TextField name="email" onChangeText={onChangeText} />);
    fireEvent.changeText(input(), 'x');
    expect(onChangeText).toHaveBeenCalledWith('x');
  });

  it('lets an explicit value override the engine', () => {
    wrap(<TextField name="email" value="fisso" />);
    expect(input().props.value).toBe('fisso');
  });
});

describe('rbac', () => {
  const POLICY: RbacPolicy = {
    roles: [
      { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
      { name: 'viewer', permissions: [{ resource: 'profile', action: 'read' }] },
    ],
  };
  const as = (roles: string[], ui: React.ReactElement) =>
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u', roles }}>
        {ui}
      </RbacProvider>,
    );
  const editProfile = { resource: 'profile', action: 'edit' } as const;

  it('hides by default when denied', () => {
    as(['viewer'], <TextField label="Nome" access={editProfile} />);
    expect(screen.queryByText('Nome')).toBeNull();
  });

  it('keeps the value readable but uneditable under readonly', () => {
    // Unlike Button, a text field *has* a read-only state, so it does
    // not collapse into disabled: the value stays legible.
    as(
      ['viewer'],
      <TextField
        label="Nome"
        value="Maria"
        access={{ ...editProfile, onUnauthorized: 'readonly' }}
      />,
    );
    expect(input().props.editable).toBe(false);
    expect(input().props.value).toBe('Maria');
    expect(flat(screen.getByText('Nome').props.style).color).toBe(
      semanticLight.text.primary,
    );
  });

  it('greys it under disable, which is a different message', () => {
    as(
      ['viewer'],
      <TextField label="Nome" access={{ ...editProfile, onUnauthorized: 'disable' }} />,
    );
    expect(flat(screen.getByText('Nome').props.style).color).toBe(
      semanticLight.text.disabled,
    );
  });
});

describe('sx', () => {
  it('targets slots, because a field has parts you cannot compose around', () => {
    render(<TextField label="Email" sx={{ label: { color: '#ff0000' } }} />);
    expect(flat(screen.getByText('Email').props.style).color).toBe('#ff0000');
  });
});
