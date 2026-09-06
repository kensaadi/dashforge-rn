import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Modal as RNModal, StyleSheet, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Modal } from './Modal';

/**
 * `StyleSheet.flatten` and not a hand-rolled merge: these styles carry
 * registered ids (`StyleSheet.absoluteFill` is a number), which an
 * `Object.assign` silently turns into nothing.
 */
const flat = (style: unknown) =>
  (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;

const TOKENS = defaultComponentTokens(semanticLight).Modal.tokens;
const host = () => screen.UNSAFE_getByType(RNModal);
/**
 * Found by what it paints, not by its component type: a `Pressable`
 * renders a host `View`, so asking for the type finds nothing.
 */
const scrim = () =>
  screen
    .UNSAFE_getAllByType(View)
    .find((v) => flat(v.props.style).backgroundColor === TOKENS.scrim)!;

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('opening and closing', () => {
  it('is not visible until it is opened', () => {
    render(
      <Modal open={false}>
        <Text>dentro</Text>
      </Modal>,
    );
    expect(host().props.visible).toBe(false);
  });

  it('shows its content when open', () => {
    render(
      <Modal open>
        <Text>dentro</Text>
      </Modal>,
    );
    expect(host().props.visible).toBe(true);
    expect(screen.getByText('dentro')).toBeTruthy();
  });

  it('does not close itself: it asks', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        <Text>dentro</Text>
      </Modal>,
    );
    fireEvent.press(scrim());
    expect(onClose).toHaveBeenCalled();
    // Still up, because the caller holds the state that decides.
    expect(host().props.visible).toBe(true);
  });

  it('answers the Android back button through the same door', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        <Text>dentro</Text>
      </Modal>,
    );
    host().props.onRequestClose();
    expect(onClose).toHaveBeenCalled();
  });

  it('ignores both when it is not dismissible', () => {
    const onClose = jest.fn();
    render(
      <Modal open dismissible={false} onClose={onClose}>
        <Text>dentro</Text>
      </Modal>,
    );
    fireEvent.press(scrim());
    host().props.onRequestClose();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('the panel', () => {
  const panel = () => flat(screen.getByText('dentro').parent?.parent?.props?.style);

  it.each(['sm', 'md', 'lg'] as const)('is capped at the %s width', (size) => {
    render(
      <Modal open size={size}>
        <Text>dentro</Text>
      </Modal>,
    );
    expect(panel().maxWidth).toBe(TOKENS.maxWidth[size]);
  });

  it('stops growing before it fills the screen', () => {
    render(
      <Modal open>
        <Text>dentro</Text>
      </Modal>,
    );
    // Tall content is the caller's to handle: the panel caps itself and
    // does not scroll, because a scroll region would have to decide
    // whether the footer scrolls with the content.
    expect(panel().maxHeight).toBe('85%');
  });

  it('uses the modal step of the elevation scale, which nothing else does', () => {
    render(
      <Modal open>
        <Text>dentro</Text>
      </Modal>,
    );
    expect(panel().elevation).toBe(TOKENS.elevation.elevation);
    expect(panel().shadowOpacity).toBe(TOKENS.elevation.shadowOpacity);
  });
});

describe('accessibility', () => {
  it('hides what is behind it, which is what makes it a dialog', () => {
    render(
      <Modal open label="Elimina il progetto">
        <Text>dentro</Text>
      </Modal>,
    );
    const panel = screen.getByLabelText('Elimina il progetto');
    expect(panel.props.accessibilityViewIsModal).toBe(true);
  });

  it('leaves the scrim out of the reading order', () => {
    render(
      <Modal open>
        <Text>dentro</Text>
      </Modal>,
    );
    // A way to leave, not a control: announcing it would put a nameless
    // button between the reader and the dialog.
    expect(scrim().props.accessible).toBe(false);
  });

  it('covers the status bar on Android', () => {
    render(
      <Modal open>
        <Text>dentro</Text>
      </Modal>,
    );
    expect(host().props.statusBarTranslucent).toBe(true);
  });
});

describe('composed the way a card is', () => {
  it('takes Card header and footer, and the rule still bleeds to the edges', () => {
    render(
      <Modal open>
        <Modal.Header title="Elimina" subtitle="Non si torna indietro" />
        <Modal.Footer divider>
          <Text>Annulla</Text>
        </Modal.Footer>
      </Modal>,
    );

    expect(screen.getByText('Elimina').props.accessibilityRole).toBe('header');
    // The footer's rule reads the panel's padding from the card context
    // it was lent, so it reaches the panel's edges rather than stopping
    // inside them.
    const rule = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.marginHorizontal === -TOKENS.padding && st.backgroundColor);
    expect(rule).toBeDefined();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [
      { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
      { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
    ],
  };

  it('stays shut when the subject may not see it', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Modal open access={{ resource: 'invoice', action: 'delete' }}>
          <Text>riservato</Text>
        </Modal>
      </RbacProvider>,
    );
    expect(host().props.visible).toBe(false);
    expect(screen.queryByText('riservato')).toBeNull();
  });

  it('honours visibleWhen', () => {
    render(
      <Modal open visibleWhen={() => false}>
        <Text>nascosto</Text>
      </Modal>,
    );
    expect(host().props.visible).toBe(false);
  });
});
