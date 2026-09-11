import { useState } from 'react';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Animated, ScrollView, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Tabs } from './Tabs';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Tabs.tokens;

const tab = (label: string) => screen.getByRole('tab', { name: label });

/** Tabs report where they landed; nothing is laid out in the test renderer. */
const layOut = (label: string, x: number, width: number) =>
  act(() => {
    fireEvent(screen.getByText(label), 'layout', {
      nativeEvent: { layout: { x, y: 0, width, height: 44 } },
    });
  });

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

const basic = (props: Record<string, unknown> = {}) =>
  render(
    <Tabs {...props}>
      <Tabs.List>
        <Tabs.Tab value="all" label="Tutti" />
        <Tabs.Tab value="unread" label="Non letti" />
      </Tabs.List>
      <Tabs.Panel value="all">
        <Text>tutto</Text>
      </Tabs.Panel>
      <Tabs.Panel value="unread">
        <Text>solo i nuovi</Text>
      </Tabs.Panel>
    </Tabs>,
  );

describe('the selection', () => {
  it('opens the first tab when nobody named one', () => {
    // The common case needs no `defaultValue` and no empty first render.
    basic();
    expect(screen.getByText('tutto')).toBeTruthy();
    expect(screen.queryByText('solo i nuovi')).toBeNull();
  });

  it('opens the one it was told to', () => {
    basic({ defaultValue: 'unread' });
    expect(screen.getByText('solo i nuovi')).toBeTruthy();
  });

  it('changes on a press and says so', () => {
    const onValueChange = jest.fn();
    basic({ onValueChange });
    fireEvent.press(screen.getByText('Non letti'));
    expect(onValueChange).toHaveBeenCalledWith('unread');
    expect(screen.getByText('solo i nuovi')).toBeTruthy();
  });

  it('stays where the caller puts it when it is controlled', () => {
    const onValueChange = jest.fn();
    render(
      <Tabs value="all" onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Tab value="all" label="Tutti" />
          <Tabs.Tab value="unread" label="Non letti" />
        </Tabs.List>
        <Tabs.Panel value="all">
          <Text>tutto</Text>
        </Tabs.Panel>
        <Tabs.Panel value="unread">
          <Text>solo i nuovi</Text>
        </Tabs.Panel>
      </Tabs>,
    );
    fireEvent.press(screen.getByText('Non letti'));
    expect(onValueChange).toHaveBeenCalledWith('unread');
    // The caller did not move, so neither did the panel.
    expect(screen.getByText('tutto')).toBeTruthy();
  });

  it('says nothing when the tab that was pressed is already open', () => {
    const onValueChange = jest.fn();
    basic({ onValueChange });
    fireEvent.press(screen.getByText('Tutti'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('follows a controlled value that changed elsewhere', () => {
    function Host() {
      const [value, setValue] = useState<string>('all');
      return (
        <>
          <Text onPress={() => setValue('unread')}>vai</Text>
          <Tabs value={value} onValueChange={(next) => setValue(String(next))}>
            <Tabs.List>
              <Tabs.Tab value="all" label="Tutti" />
              <Tabs.Tab value="unread" label="Non letti" />
            </Tabs.List>
            <Tabs.Panel value="unread">
              <Text>solo i nuovi</Text>
            </Tabs.Panel>
          </Tabs>
        </>
      );
    }
    render(<Host />);
    expect(screen.queryByText('solo i nuovi')).toBeNull();
    fireEvent.press(screen.getByText('vai'));
    expect(screen.getByText('solo i nuovi')).toBeTruthy();
  });
});

describe('the panels', () => {
  it('leaves the unselected one unmounted, which is the cheap default', () => {
    basic();
    expect(screen.queryByText('solo i nuovi')).toBeNull();
  });

  it('keeps one mounted and hidden when asked, for a scroll position worth saving', () => {
    render(
      <Tabs>
        <Tabs.List>
          <Tabs.Tab value="all" label="Tutti" />
          <Tabs.Tab value="unread" label="Non letti" />
        </Tabs.List>
        <Tabs.Panel value="unread" keepMounted testID="panel">
          <Text>solo i nuovi</Text>
        </Tabs.Panel>
      </Tabs>,
    );
    const panel = screen.getByTestId('panel', { includeHiddenElements: true });
    expect(panel).toBeTruthy();
    expect(flat(panel.props.style).display).toBe('none');
    // Hidden and not merely invisible: a panel left in the reading order
    // is content a reader has to walk past to reach the open one.
    expect(panel.props.accessibilityElementsHidden).toBe(true);
  });
});

describe('the mark under the selected tab', () => {
  const indicator = () =>
    screen
      .UNSAFE_getAllByType(Animated.View)
      .find((v) => flat(v.props.style).backgroundColor === TOKENS.color.indicator)!;

  it('sits where the selected tab was measured, without travelling the first time', () => {
    basic();
    layOut('Tutti', 0, 100);
    layOut('Non letti', 100, 120);
    const s = flat(indicator().props.style);
    expect(s.width).toBeDefined();
    expect(s.transform).toBeDefined();
  });

  it('is the only thing that says which tab is open, visually', () => {
    basic();
    expect(indicator()).toBeTruthy();
    // The rail is a border on the strip and not a second line: one says
    // where the strip ends, the other which tab you are in.
    const strip = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((st) => st.borderBottomColor === TOKENS.rail.color);
    expect(strip?.borderBottomWidth).toBe(TOKENS.rail.thickness);
  });

  it('is decoration, and says nothing', () => {
    basic();
    expect(indicator().props.accessibilityElementsHidden).toBe(true);
  });
});

describe('how the width is shared', () => {
  it('is divided equally by default', () => {
    basic();
    expect(flat(tab('Tutti').props.style).flex).toBe(1);
  });

  it('is left to each label when the strip scrolls', () => {
    render(
      <Tabs>
        <Tabs.List variant="scrollable">
          <Tabs.Tab value="a" label="Uno" />
          <Tabs.Tab value="b" label="Due" />
        </Tabs.List>
      </Tabs>,
    );
    expect(flat(tab('Uno').props.style).flex).toBeUndefined();
    expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(1);
  });

  it('does not put a scroll view in the way when it is fitted', () => {
    basic();
    expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
  });
});

describe('what it tells a screen reader', () => {
  it('is a tablist of tabs, and says which one is open', () => {
    basic();
    expect(tab('Tutti').props.accessibilityRole).toBe('tab');
    // `selected` and not `checked`: a tab is a view, and the two are
    // read out differently.
    expect(tab('Tutti').props.accessibilityState.selected).toBe(true);
    expect(tab('Non letti').props.accessibilityState.selected).toBe(false);
  });

  it('names the set when it was given a name', () => {
    render(
      <Tabs>
        <Tabs.List accessibilityLabel="Filtra la posta" testID="list">
          <Tabs.Tab value="a" label="Uno" />
        </Tabs.List>
      </Tabs>,
    );
    const list = screen.getByTestId('list');
    expect(list.props.accessibilityRole).toBe('tablist');
    expect(list.props.accessibilityLabel).toBe('Filtra la posta');
  });
});

describe('being inert', () => {
  it('disables every tab at once', () => {
    const onValueChange = jest.fn();
    basic({ disabled: true, onValueChange });
    fireEvent.press(screen.getByText('Non letti'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables one on its own', () => {
    const onValueChange = jest.fn();
    render(
      <Tabs onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Tab value="a" label="Uno" />
          <Tabs.Tab value="b" label="Due" disabled />
        </Tabs.List>
      </Tabs>,
    );
    fireEvent.press(screen.getByText('Due'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tab('Due').props.accessibilityState.disabled).toBe(true);
  });
});

describe('being used wrong', () => {
  it('says where a tab belongs rather than rendering nothing', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Tabs.Tab value="a" label="Uno" />)).toThrow(
      /has to be inside a <Tabs>/,
    );
    error.mockRestore();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'inbox', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    basic({ visibleWhen: () => false });
    expect(screen.queryByText('Tutti')).toBeNull();
  });

  it('hides one tab without hiding the strip', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Tabs>
          <Tabs.List>
            <Tabs.Tab value="a" label="Uno" />
            <Tabs.Tab value="b" label="Due" access={{ resource: 'inbox', action: 'write' }} />
          </Tabs.List>
        </Tabs>
      </RbacProvider>,
    );
    expect(screen.getByText('Uno')).toBeTruthy();
    expect(screen.queryByText('Due')).toBeNull();
  });
});
