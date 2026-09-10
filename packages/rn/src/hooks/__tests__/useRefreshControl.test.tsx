import { FlatList, RefreshControl, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { semanticDark, semanticLight } from '../../tokens/semantic';
import { useRefreshControl } from '../useRefreshControl';

function List({ refreshing = false, onRefresh = jest.fn() }) {
  const refresh = useRefreshControl({ refreshing, onRefresh });
  return (
    <FlatList
      testID="list"
      data={['a']}
      keyExtractor={(x) => x}
      renderItem={({ item }) => <Text>{item}</Text>}
      refreshControl={refresh}
    />
  );
}

const control = () => screen.UNSAFE_getByType(RefreshControl);

beforeEach(() => setMode('light'));

describe('the control', () => {
  it('fits whatever scroll view it was handed to', () => {
    // The point of the hook: the refresh control is a prop of a scroll
    // view, so a component wrapped around one could never reach it.
    render(<List />);
    expect(screen.getByTestId('list').props.refreshControl).toBeTruthy();
    expect(control()).toBeTruthy();
  });

  it('passes the state and the callback straight through', () => {
    const onRefresh = jest.fn();
    render(<List refreshing onRefresh={onRefresh} />);
    expect(control().props.refreshing).toBe(true);
    expect(control().props.onRefresh).toBe(onRefresh);
  });
});

describe('the colours', () => {
  it('states both platforms rather than taking a grey that belongs to no theme', () => {
    render(<List />);
    expect(control().props.tintColor).toBe(semanticLight.text.muted);
    expect(control().props.colors).toEqual([semanticLight.text.muted]);
    expect(control().props.progressBackgroundColor).toBe(semanticLight.surface.raised);
  });

  it('follows the mode', () => {
    setMode('dark');
    render(<List />);
    expect(control().props.tintColor).toBe(semanticDark.text.muted);
    expect(control().props.progressBackgroundColor).toBe(semanticDark.surface.raised);
  });
});
