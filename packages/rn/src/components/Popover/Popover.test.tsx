import { Modal as RNModal, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Popover, place } from './Popover';

const TOKENS = defaultComponentTokens(semanticLight).Popover.tokens;
const host = () => screen.UNSAFE_getByType(RNModal);

beforeEach(() => setMode('light'));

/**
 * The placement is the whole of a popover and it is not observable from
 * a tree: nothing is laid out and nothing is measured in the test
 * renderer. It lives outside the component so it can be checked at all.
 */
describe('where the panel goes', () => {
  const screenSize = { width: 400, height: 800 };
  const limits = { margin: 12, offset: 8 };
  const panel = { width: 200, height: 100 };

  it('sits under its anchor when there is room', () => {
    const anchor = { x: 100, y: 100, width: 40, height: 40 };
    const spot = place(anchor, panel, screenSize, limits, 'bottom');
    expect(spot.side).toBe('bottom');
    expect(spot.top).toBe(148);
  });

  it('centres on its anchor', () => {
    const anchor = { x: 100, y: 100, width: 40, height: 40 };
    // Anchor centre is 120, panel is 200 wide, so it starts at 20.
    expect(place(anchor, panel, screenSize, limits, 'bottom').left).toBe(20);
  });

  it('flips above when the bottom of the phone is in the way', () => {
    // A panel below an anchor near the bottom opens into the keyboard.
    const anchor = { x: 100, y: 740, width: 40, height: 40 };
    const spot = place(anchor, panel, screenSize, limits, 'bottom');
    expect(spot.side).toBe('top');
    expect(spot.top).toBe(740 - 8 - 100);
  });

  it('flips below when the top is in the way', () => {
    const anchor = { x: 100, y: 10, width: 40, height: 40 };
    expect(place(anchor, panel, screenSize, limits, 'top').side).toBe('bottom');
  });

  it('keeps the preference when neither side fits', () => {
    // Flipping into a worse fit helps nobody.
    const tall = { width: 200, height: 700 };
    const anchor = { x: 100, y: 380, width: 40, height: 40 };
    expect(place(anchor, tall, screenSize, limits, 'bottom').side).toBe('bottom');
  });

  it('refuses to hang off the right edge', () => {
    const anchor = { x: 370, y: 100, width: 30, height: 30 };
    const spot = place(anchor, panel, screenSize, limits, 'bottom');
    expect(spot.left).toBe(400 - 200 - 12);
  });

  it('refuses to hang off the left edge', () => {
    const anchor = { x: 0, y: 100, width: 30, height: 30 };
    expect(place(anchor, panel, screenSize, limits, 'bottom').left).toBe(12);
  });

  it('does not fight itself on a screen narrower than the panel', () => {
    const wide = { width: 600, height: 100 };
    const anchor = { x: 10, y: 100, width: 30, height: 30 };
    expect(place(anchor, wide, screenSize, limits, 'bottom').left).toBe(12);
  });
});

describe('the anchor', () => {
  it('is rendered where it was written', () => {
    render(
      <Popover open={false} anchor={<Text>Apri</Text>}>
        <Text>dentro</Text>
      </Popover>,
    );
    expect(screen.getByText('Apri')).toBeTruthy();
  });
});

describe('being open', () => {
  it('is closed until it is told otherwise', () => {
    render(
      <Popover open={false} anchor={<Text>Apri</Text>}>
        <Text>dentro</Text>
      </Popover>,
    );
    expect(host().props.visible).toBe(false);
  });

  it('shows what is in it', () => {
    render(
      <Popover open anchor={<Text>Apri</Text>}>
        <Text>dentro</Text>
      </Popover>,
    );
    expect(host().props.visible).toBe(true);
    expect(screen.getByText('dentro')).toBeTruthy();
  });

  it('leaves the page readable, which is what separates it from a dialog', () => {
    // A dialog darkens the page because the page can wait. A popover is
    // about something on the page.
    render(
      <Popover open anchor={<Text>Apri</Text>}>
        <Text>dentro</Text>
      </Popover>,
    );
    const scrim = screen
      .UNSAFE_getAllByType(View)
      .find((v) => {
        const style = Array.isArray(v.props.style)
          ? Object.assign({}, ...v.props.style.flat(9).filter(Boolean))
          : v.props.style;
        return style?.backgroundColor === TOKENS.scrim;
      });
    expect(TOKENS.scrim).toBe('transparent');
    expect(scrim).toBeTruthy();
  });

  it('asks to close rather than closing itself', () => {
    const onClose = jest.fn();
    render(
      <Popover open onClose={onClose} anchor={<Text>Apri</Text>}>
        <Text>dentro</Text>
      </Popover>,
    );
    fireEvent(host(), 'requestClose');
    expect(onClose).toHaveBeenCalled();
    // It did not close: the caller keeps the state that says whether it
    // is open.
    expect(host().props.visible).toBe(true);
  });
});

describe('the Dashforge props', () => {
  it('takes the anchor with it when visibleWhen says so', () => {
    render(
      <Popover open anchor={<Text>Apri</Text>} visibleWhen={() => false}>
        <Text>dentro</Text>
      </Popover>,
    );
    expect(screen.queryByText('Apri')).toBeNull();
    expect(screen.queryByText('dentro')).toBeNull();
  });
});
