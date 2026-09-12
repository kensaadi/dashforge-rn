import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Animated, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Accordion } from './Accordion';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Accordion.tokens;
const header = (title: string) => screen.getByRole('button', { name: title });

const three = (props: Record<string, unknown> = {}) =>
  render(
    <Accordion {...props}>
      <Accordion.Item value="a" title="Uno">
        <Text>risposta uno</Text>
      </Accordion.Item>
      <Accordion.Item value="b" title="Due">
        <Text>risposta due</Text>
      </Accordion.Item>
      <Accordion.Item value="c" title="Tre">
        <Text>risposta tre</Text>
      </Accordion.Item>
    </Accordion>,
  );

beforeEach(() => setMode('light'));

describe('what is open', () => {
  it('starts with everything folded away', () => {
    three();
    expect(screen.queryByText('risposta uno')).toBeNull();
  });

  it('opens what it was told to', () => {
    three({ defaultValue: ['b'] });
    expect(screen.getByText('risposta due')).toBeTruthy();
  });

  it('opens on a press', () => {
    three();
    fireEvent.press(screen.getByText('Uno'));
    expect(screen.getByText('risposta uno')).toBeTruthy();
  });

  it('closes the others, because one answer on screen is the point', () => {
    three({ defaultValue: ['a'] });
    fireEvent.press(screen.getByText('Due'));
    expect(screen.getByText('risposta due')).toBeTruthy();
    // The first one is on its way out and is no longer announced.
    expect(screen.queryByText('risposta uno', { includeHiddenElements: false })).toBeNull();
  });

  it('leaves that to the reader when it was asked to', () => {
    three({ type: 'multiple', defaultValue: ['a'] });
    fireEvent.press(screen.getByText('Due'));
    expect(screen.getByText('risposta uno')).toBeTruthy();
    expect(screen.getByText('risposta due')).toBeTruthy();
  });

  it('folds the open one away again', () => {
    const onValueChange = jest.fn();
    three({ defaultValue: ['a'], onValueChange });
    fireEvent.press(screen.getByText('Uno'));
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('stays where the caller puts it when it is controlled', () => {
    const onValueChange = jest.fn();
    three({ value: ['a'], onValueChange });
    fireEvent.press(screen.getByText('Due'));
    expect(onValueChange).toHaveBeenCalledWith(['b']);
    // The caller did not move, so neither did the panel.
    expect(screen.getByText('risposta uno')).toBeTruthy();
  });
});

describe('the panel', () => {
  it('is not mounted until it is asked for', () => {
    // Twenty answers are twenty headers until somebody asks for one.
    three();
    expect(screen.queryByText('risposta tre')).toBeNull();
  });

  it('grows from nothing to what it measured', () => {
    three({ defaultValue: ['a'] });
    const box = screen
      .UNSAFE_getAllByType(Animated.View)
      .find((v) => flat(v.props.style).overflow === 'hidden')!;
    expect(box).toBeTruthy();
    // The measurement happens on the inner view, not on the box whose
    // height is being animated.
    act(() => {
      fireEvent(box.props.children, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 120 } },
      });
    });
    expect(flat(box.props.style).overflow).toBe('hidden');
  });
});

describe('the lines between items', () => {
  const lines = () =>
    screen
      .UNSAFE_getAllByType(View)
      .filter((v) => flat(v.props.style).backgroundColor === TOKENS.separator.color);

  it('draws one above every item but the first', () => {
    three();
    expect(lines()).toHaveLength(2);
  });

  it('can be turned off', () => {
    three({ divider: false });
    expect(lines()).toHaveLength(0);
  });

  it('hands the first place on when an item decides not to render', () => {
    // A hidden first item must not leave a line at the top of the list.
    render(
      <Accordion>
        <Accordion.Item value="a" title="Uno" visibleWhen={() => false}>
          <Text>uno</Text>
        </Accordion.Item>
        <Accordion.Item value="b" title="Due">
          <Text>due</Text>
        </Accordion.Item>
        <Accordion.Item value="c" title="Tre">
          <Text>tre</Text>
        </Accordion.Item>
      </Accordion>,
    );
    expect(lines()).toHaveLength(1);
  });
});

describe('what it tells a screen reader', () => {
  it('says whether the answer under it is showing', () => {
    // `expanded` and not `selected`: a header is not the chosen one of
    // several, it is a thing with an answer under it.
    three({ defaultValue: ['a'] });
    expect(header('Uno').props.accessibilityState.expanded).toBe(true);
    expect(header('Due').props.accessibilityState.expanded).toBe(false);
  });
});

describe('being inert', () => {
  it('disables every item at once', () => {
    const onValueChange = jest.fn();
    three({ disabled: true, onValueChange });
    fireEvent.press(screen.getByText('Uno'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables one on its own', () => {
    const onValueChange = jest.fn();
    render(
      <Accordion onValueChange={onValueChange}>
        <Accordion.Item value="a" title="Uno" disabled>
          <Text>uno</Text>
        </Accordion.Item>
      </Accordion>,
    );
    fireEvent.press(screen.getByText('Uno'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(header('Uno').props.accessibilityState.disabled).toBe(true);
  });
});

describe('being used wrong', () => {
  it('says where an item belongs rather than rendering nothing', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Accordion.Item value="a" title="Uno">
          <Text>uno</Text>
        </Accordion.Item>,
      ),
    ).toThrow(/has to be inside an <Accordion>/);
    error.mockRestore();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'faq', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    three({ visibleWhen: () => false });
    expect(screen.queryByText('Uno')).toBeNull();
  });

  it('hides one item without hiding the rest', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Accordion>
          <Accordion.Item value="a" title="Uno">
            <Text>uno</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Due" access={{ resource: 'faq', action: 'write' }}>
            <Text>due</Text>
          </Accordion.Item>
        </Accordion>
      </RbacProvider>,
    );
    expect(screen.getByText('Uno')).toBeTruthy();
    expect(screen.queryByText('Due')).toBeNull();
  });
});
