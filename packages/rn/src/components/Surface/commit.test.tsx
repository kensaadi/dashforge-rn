import { ScrollView, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Surface } from './Surface';
import { SurfaceViewport } from './SurfaceViewport';
import { claimStaggerSlot, resetStagger, STAGGER_MS } from './stagger';

let warn: jest.SpyInstance;

beforeEach(() => {
  resetStagger();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('the stagger', () => {
  it('lets the first region through at once', () => {
    expect(claimStaggerSlot(Symbol('a'))).toBe(0);
  });

  it('pulls the second one apart, so two changes are not one blink', () => {
    claimStaggerSlot(Symbol('a'));
    expect(claimStaggerSlot(Symbol('b'))).toBe(STAGGER_MS);
  });

  it('keeps one slot per region, not one per change', () => {
    // A region that changes three times in a tick is one region. Giving
    // it a new slot each time would land the third a third of a second
    // late for no reason.
    const a = Symbol('a');
    expect(claimStaggerSlot(a)).toBe(0);
    expect(claimStaggerSlot(a)).toBe(0);
    expect(claimStaggerSlot(a)).toBe(0);
  });

  it('forgets the batch on the next tick', async () => {
    claimStaggerSlot(Symbol('a'));
    await Promise.resolve();
    expect(claimStaggerSlot(Symbol('b'))).toBe(0);
  });
});

const view = (ready: boolean, props = {}) => (
  <Surface transition="none" {...props}>
    <Surface.Case when={ready}>
      <Text>nuovo</Text>
    </Surface.Case>
    <Surface.Fallback>
      <Text>vecchio</Text>
    </Surface.Fallback>
  </Surface>
);

describe('without a viewport', () => {
  it('warns that there is nothing to wait for, and behaves as immediate', async () => {
    const { rerender } = render(view(false));
    rerender(view(true));

    await waitFor(() => expect(screen.getByText('nuovo')).toBeTruthy());
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no ambient scroll state'),
    );
  });

  it('says nothing when the caller asked for immediate', async () => {
    const { rerender } = render(view(false, { commit: 'immediate' }));
    rerender(view(true, { commit: 'immediate' }));

    await waitFor(() => expect(screen.getByText('nuovo')).toBeTruthy());
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('inside a viewport', () => {
  const wrap = (ui: React.ReactElement) =>
    render(
      <SurfaceViewport>
        {(scroll) => (
          <ScrollView testID="scroll" {...scroll}>
            {ui}
          </ScrollView>
        )}
      </SurfaceViewport>,
    );

  const scrollEvent = { nativeEvent: { contentOffset: { x: 0, y: 40 } } };

  it('hands the scroll container what it needs, anchoring included', () => {
    wrap(view(false));
    const scroll = screen.getByTestId('scroll');
    // The anchoring is what keeps the line you are reading where it is
    // when content grows above it.
    expect(scroll.props.maintainVisibleContentPosition).toEqual({
      minIndexForVisible: 0,
    });
    expect(scroll.props.scrollEventThrottle).toBe(16);
  });

  it('holds the change while a scroll is in flight', async () => {
    const { rerender } = wrap(view(false));
    const scroll = screen.getByTestId('scroll');

    fireEvent(scroll, 'momentumScrollBegin');
    rerender(
      <SurfaceViewport>
        {(s) => (
          <ScrollView testID="scroll" {...s}>
            {view(true)}
          </ScrollView>
        )}
      </SurfaceViewport>,
    );

    // Any height change during momentum moves the landing point: the
    // user flicks aiming at something and arrives somewhere else.
    await act(async () => {});
    expect(screen.getByText('vecchio')).toBeTruthy();
    expect(screen.queryByText('nuovo')).toBeNull();
  });

  it('lets it through once the scroll stops', async () => {
    const { rerender } = wrap(view(false));
    const scroll = screen.getByTestId('scroll');

    fireEvent(scroll, 'momentumScrollBegin');
    rerender(
      <SurfaceViewport>
        {(s) => (
          <ScrollView testID="scroll" {...s}>
            {view(true)}
          </ScrollView>
        )}
      </SurfaceViewport>,
    );
    await act(async () => {});
    expect(screen.queryByText('nuovo')).toBeNull();

    fireEvent(scroll, 'momentumScrollEnd', scrollEvent);
    await waitFor(() => expect(screen.getByText('nuovo')).toBeTruthy());
  });

  it('does not wait when the caller said immediate', async () => {
    const { rerender } = wrap(view(false, { commit: 'immediate' }));
    fireEvent(screen.getByTestId('scroll'), 'momentumScrollBegin');
    rerender(
      <SurfaceViewport>
        {(s) => (
          <ScrollView testID="scroll" {...s}>
            {view(true, { commit: 'immediate' })}
          </ScrollView>
        )}
      </SurfaceViewport>,
    );
    // Not seeing it has to cost something for this to be right, and
    // when it does, the scroll is not a reason to wait.
    await waitFor(() => expect(screen.getByText('nuovo')).toBeTruthy());
  });
});
