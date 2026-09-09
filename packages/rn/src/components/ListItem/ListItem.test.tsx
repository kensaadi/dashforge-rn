import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { List, ListItem } from './ListItem';
import { listItemRecipe } from './listItem.variants';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).ListItem.tokens;

const rootStyle = (testID = 'row') => flat(screen.getByTestId(testID).props.style);

/** Every hairline currently drawn, found by the colour only it uses. */
const hairlines = () =>
  screen
    .UNSAFE_getAllByType(View)
    .filter((v) => flat(v.props.style).backgroundColor === TOKENS.separator.color);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('the row', () => {
  it('draws the title, the subtitle and the value', () => {
    render(<ListItem title="Lingua" subtitle="Interfaccia" value="Italiano" />);
    expect(screen.getByText('Lingua')).toBeTruthy();
    expect(screen.getByText('Interfaccia')).toBeTruthy();
    expect(screen.getByText('Italiano')).toBeTruthy();
  });

  it('has no ground of its own, because it does not know what it was dropped on', () => {
    render(<ListItem testID="row" title="Lingua" />);
    expect(rootStyle().backgroundColor).toBe('transparent');
  });

  it('paints only while pressed', () => {
    // The test renderer cannot hold a `Pressable` down, so the press
    // appearance is checked where it is decided.
    const resolve = listItemRecipe(TOKENS);
    expect(resolve({ pressed: true }).root.backgroundColor).toBe(TOKENS.color.bgPressed);
    expect(resolve({ pressed: false }).root.backgroundColor).toBe(TOKENS.color.bg);
  });

  it('states a floor and never a height, so a row grows with the text setting', () => {
    render(<ListItem testID="row" title="Lingua" />);
    expect(rootStyle().minHeight).toBe(TOKENS.minHeight);
    expect(rootStyle().height).toBeUndefined();
  });

  it('truncates the title on one line and the subtitle on two', () => {
    render(<ListItem title="Lingua" subtitle="Interfaccia" />);
    expect(screen.getByText('Lingua').props.numberOfLines).toBe(1);
    expect(screen.getByText('Interfaccia').props.numberOfLines).toBe(2);
  });

  it('lets the caller say how many lines each may take', () => {
    render(<ListItem title="Lingua" subtitle="Interfaccia" titleLines={2} subtitleLines={1} />);
    expect(screen.getByText('Lingua').props.numberOfLines).toBe(2);
    expect(screen.getByText('Interfaccia').props.numberOfLines).toBe(1);
  });

  it('leaves a node alone, because the caller has taken the decision over', () => {
    render(<ListItem title={<Text testID="own">Lingua</Text>} />);
    expect(screen.getByTestId('own')).toBeTruthy();
  });
});

describe('being pressable', () => {
  it('is a button only when it was given something to do', () => {
    render(<ListItem testID="row" title="Lingua" />);
    expect(screen.getByTestId('row').props.accessibilityRole).toBeUndefined();
  });

  it('is a button when it has an onPress', () => {
    const onPress = jest.fn();
    render(<ListItem testID="row" title="Lingua" onPress={onPress} />);
    expect(screen.getByTestId('row').props.accessibilityRole).toBe('button');
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalled();
  });

  it('is inert and dimmed when disabled', () => {
    const onPress = jest.fn();
    render(<ListItem testID="row" title="Lingua" onPress={onPress} disabled />);
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).not.toHaveBeenCalled();
    expect(rootStyle().opacity).toBe(semanticLight.opacity.disabled);
  });
});

describe('the leading slot', () => {
  const Dot = ({ size, color }: { size?: number; color?: string }) => (
    <View testID="dot" style={{ width: size, height: size, backgroundColor: color }} />
  );

  it('draws the icon shorthand at the token size and colour', () => {
    render(<ListItem title="Lingua" icon={Dot} />);
    const s = flat(screen.getByTestId('dot').props.style);
    expect(s.width).toBe(TOKENS.iconSize);
    expect(s.backgroundColor).toBe(TOKENS.color.icon);
  });

  it('gives the slot to `leading` and says so when both were given', () => {
    render(<ListItem title="Lingua" icon={Dot} leading={<View testID="own" />} />);
    expect(screen.getByTestId('own')).toBeTruthy();
    expect(screen.queryByTestId('dot')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('both `leading` and `icon`'));
  });
});

describe('the chevron', () => {
  it('is off unless it was asked for', () => {
    render(<ListItem title="Lingua" onPress={jest.fn()} />);
    const marks = screen
      .UNSAFE_getAllByType(View)
      .filter((v) => flat(v.props.style).borderRightWidth === TOKENS.chevron.thickness);
    expect(marks).toHaveLength(0);
  });

  it('says so when it leads nowhere', () => {
    render(<ListItem title="Lingua" chevron />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('chevron and no `onPress`'));
  });

  it('is quiet when the row actually goes somewhere', () => {
    render(<ListItem title="Lingua" chevron onPress={jest.fn()} />);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the lines between rows', () => {
  it('draws none on a row standing on its own', () => {
    render(<ListItem title="Lingua" />);
    expect(hairlines()).toHaveLength(0);
  });

  it('gives every row in a list one, and clips the first away', () => {
    render(
      <List>
        <ListItem title="Uno" />
        <ListItem title="Due" />
        <ListItem title="Tre" />
      </List>,
    );
    // Three drawn, and the list lifts the column by exactly one
    // thickness so the topmost one falls outside the clip.
    expect(hairlines()).toHaveLength(3);
    const column = screen.UNSAFE_getAllByType(View).find(
      (v) => flat(v.props.style).marginTop === -TOKENS.separator.thickness,
    );
    expect(column).toBeTruthy();
  });

  it('starts them at the edge by default and at the text when inset', () => {
    const { unmount } = render(
      <List>
        <ListItem title="Uno" />
      </List>,
    );
    expect(flat(hairlines()[0]!.props.style).left).toBe(0);
    unmount();

    render(
      <List divider="inset">
        <ListItem title="Uno" />
      </List>,
    );
    expect(flat(hairlines()[0]!.props.style).left).toBe(TOKENS.separator.inset);
  });

  it('draws none at all when the list says none', () => {
    render(
      <List divider="none">
        <ListItem title="Uno" />
        <ListItem title="Due" />
      </List>,
    );
    expect(hairlines()).toHaveLength(0);
  });

  it('leaves no line behind for a row that decided not to render', () => {
    // The reason the line is the row's and not the list's: a separator
    // placed between children would still be there once the row it
    // belonged to had gone.
    render(
      <List>
        <ListItem title="Uno" />
        <ListItem title="Due" visibleWhen={() => false} />
        <ListItem title="Tre" />
      </List>,
    );
    expect(screen.queryByText('Due')).toBeNull();
    expect(hairlines()).toHaveLength(2);
  });

  it('takes no layout space, so a row is as tall as its content says', () => {
    render(
      <List>
        <ListItem title="Uno" />
      </List>,
    );
    expect(flat(hairlines()[0]!.props.style).position).toBe('absolute');
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'settings', action: 'read' }] }],
  };

  const asViewer = (ui: React.ReactElement) =>
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        {ui}
      </RbacProvider>,
    );

  it('is gone when visibleWhen says so', () => {
    render(<ListItem title="Lingua" visibleWhen={() => false} />);
    expect(screen.queryByText('Lingua')).toBeNull();
  });

  it('is gone when access hides it', () => {
    asViewer(<ListItem title="Lingua" access={{ resource: 'settings', action: 'write' }} />);
    expect(screen.queryByText('Lingua')).toBeNull();
  });

  it('is inert when access disables it', () => {
    const onPress = jest.fn();
    asViewer(
      <ListItem
        testID="row"
        title="Lingua"
        onPress={onPress}
        access={{ resource: 'settings', action: 'write', onUnauthorized: 'disable' }}
      />,
    );
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
