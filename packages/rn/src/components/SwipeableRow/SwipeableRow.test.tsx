import { Animated, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { ListItem } from '../ListItem/ListItem';
import { SwipeableRow, shouldOpen } from './SwipeableRow';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).SwipeableRow.tokens;

beforeEach(() => setMode('light'));

/**
 * The gesture itself is not exercised here: React Native's test renderer
 * does not run `PanResponder`, so a test that pretended to swipe would be
 * testing nothing. What is testable is the judgement the release makes,
 * which is why it lives outside the closure.
 */
describe('letting go', () => {
  const limits = { openRatio: 0.4, openVelocity: 0.4 };
  const REVEALED = 160;

  it('opens once the swipe is past the fraction', () => {
    expect(shouldOpen({ dx: -65, vx: 0 }, REVEALED, limits, 'left')).toBe(true);
    expect(shouldOpen({ dx: -63, vx: 0 }, REVEALED, limits, 'left')).toBe(false);
  });

  it('opens a short hard flick, because speed is an intention', () => {
    expect(shouldOpen({ dx: -20, vx: -0.9 }, REVEALED, limits, 'left')).toBe(true);
  });

  it('reads the same rule in both directions', () => {
    expect(shouldOpen({ dx: 65, vx: 0 }, REVEALED, limits, 'right')).toBe(true);
    expect(shouldOpen({ dx: 20, vx: 0.9 }, REVEALED, limits, 'right')).toBe(true);
  });

  it('ignores movement the wrong way', () => {
    // Dragging right on a row whose actions are to the left of the
    // finger must not open them.
    expect(shouldOpen({ dx: 300, vx: 4 }, REVEALED, limits, 'left')).toBe(false);
    expect(shouldOpen({ dx: -300, vx: -4 }, REVEALED, limits, 'right')).toBe(false);
  });

  it('scales with what is revealed, not with the screen', () => {
    expect(shouldOpen({ dx: -50, vx: 0 }, 80, limits, 'left')).toBe(true);
    expect(shouldOpen({ dx: -50, vx: 0 }, 400, limits, 'left')).toBe(false);
  });
});

describe('the actions', () => {
  const remove = jest.fn();
  const archive = jest.fn();

  beforeEach(() => {
    remove.mockClear();
    archive.mockClear();
  });

  const row = () =>
    render(
      <SwipeableRow
        testID="row"
        rightActions={[
          { key: 'archive', label: 'Archivia', onPress: archive },
          { key: 'delete', label: 'Elimina', color: 'danger', onPress: remove },
        ]}
      >
        <ListItem title="Kenjy Saadi" />
      </SwipeableRow>,
    );

  it('draws one box per action, at the token width', () => {
    row();
    const boxes = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .filter((s) => s.width === TOKENS.actionWidth);
    expect(boxes).toHaveLength(2);
  });

  it('colours each one by its own role', () => {
    row();
    expect(flat(screen.getByLabelText('Elimina').props.style).backgroundColor).toBe(
      semanticLight.action.danger.bg,
    );
    expect(flat(screen.getByLabelText('Archivia').props.style).backgroundColor).toBe(
      TOKENS.color.secondary.bg,
    );
  });

  it('runs the one that was pressed', () => {
    row();
    fireEvent.press(screen.getByLabelText('Elimina'));
    expect(remove).toHaveBeenCalled();
    expect(archive).not.toHaveBeenCalled();
  });

  it('keeps the row and its actions from spilling over its neighbours', () => {
    row();
    expect(flat(screen.getByTestId('row').props.style).overflow).toBe('hidden');
  });

  it('paints a ground on the layer that travels, or the actions show through', () => {
    // The `ListItem` inside has none on purpose, so that it is right on
    // a card, a sheet and the page alike. This layer cannot afford that:
    // it slides over the actions.
    row();
    const travelling = screen
      .UNSAFE_getAllByType(Animated.View)
      .map((v) => flat(v.props.style))
      .find((s) => s.backgroundColor === TOKENS.contentBg);
    expect(travelling).toBeTruthy();
  });

  it('draws nothing on a side it was given nothing for', () => {
    render(
      <SwipeableRow testID="row">
        <ListItem title="Kenjy Saadi" />
      </SwipeableRow>,
    );
    const panels = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .filter((s) => s.position === 'absolute' && s.flexDirection === 'row');
    expect(panels).toHaveLength(0);
  });
});

describe('what it tells a screen reader', () => {
  it('offers every action, because a swipe is not a gesture a reader can make', () => {
    render(
      <SwipeableRow
        testID="row"
        leftActions={[{ key: 'pin', label: 'Fissa', onPress: jest.fn() }]}
        rightActions={[{ key: 'delete', label: 'Elimina', onPress: jest.fn() }]}
      >
        <Text>x</Text>
      </SwipeableRow>,
    );
    expect(screen.getByTestId('row').props.accessibilityActions).toEqual([
      { name: 'pin', label: 'Fissa' },
      { name: 'delete', label: 'Elimina' },
    ]);
  });

  it('runs the one the reader picked, without ever opening the row', () => {
    const pin = jest.fn();
    render(
      <SwipeableRow testID="row" leftActions={[{ key: 'pin', label: 'Fissa', onPress: pin }]}>
        <Text>x</Text>
      </SwipeableRow>,
    );
    fireEvent(screen.getByTestId('row'), 'accessibilityAction', {
      nativeEvent: { actionName: 'pin' },
    });
    expect(pin).toHaveBeenCalled();
  });

  it('ignores the reader when access has made the row inert', () => {
    const pin = jest.fn();
    render(
      <SwipeableRow
        testID="row"
        leftActions={[{ key: 'pin', label: 'Fissa', onPress: pin }]}
        visibleWhen={() => true}
      >
        <Text>x</Text>
      </SwipeableRow>,
    );
    fireEvent(screen.getByTestId('row'), 'accessibilityAction', {
      nativeEvent: { actionName: 'nonesiste' },
    });
    expect(pin).not.toHaveBeenCalled();
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(
      <SwipeableRow testID="row" visibleWhen={() => false}>
        <Text>x</Text>
      </SwipeableRow>,
    );
    expect(screen.queryByTestId('row')).toBeNull();
  });
});
