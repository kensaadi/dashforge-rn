import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Stack } from './Stack';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const box = () => flat(screen.getByTestId('s').props.style);
const TOKENS = defaultComponentTokens(semanticLight).Stack.tokens;

beforeEach(() => setMode('light'));

describe('direction and gap', () => {
  it('is a column with the stack gap by default', () => {
    render(
      <Stack testID="s">
        <Text>a</Text>
      </Stack>,
    );
    expect(box().flexDirection).toBe('column');
    expect(box().gap).toBe(TOKENS.gap.stack);
  });

  it.each(['none', 'inline', 'stack', 'inset', 'section'] as const)(
    'names the gap: %s',
    (gap) => {
      render(
        <Stack testID="s" gap={gap}>
          <Text>a</Text>
        </Stack>,
      );
      expect(box().gap).toBe(TOKENS.gap[gap]);
    },
  );

  it('takes a number for what the scale has no word for', () => {
    render(
      <Stack testID="s" gap={7}>
        <Text>a</Text>
      </Stack>,
    );
    expect(box().gap).toBe(7);
  });
});

describe('the cross axis default', () => {
  it('stretches in a column, which is what fills the width', () => {
    render(
      <Stack testID="s">
        <Text>a</Text>
      </Stack>,
    );
    expect(box().alignItems).toBe('stretch');
  });

  it('centres in a row, so a button beside a paragraph is not paragraph-height', () => {
    render(
      <Stack testID="s" direction="row">
        <Text>a</Text>
      </Stack>,
    );
    expect(box().alignItems).toBe('center');
  });

  it('lets the caller override either', () => {
    render(
      <Stack testID="s" direction="row" align="end">
        <Text>a</Text>
      </Stack>,
    );
    expect(box().alignItems).toBe('flex-end');
  });
});

describe('divider', () => {
  const rules = () =>
    screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .filter((st) => st.backgroundColor === TOKENS.divider);

  it('draws none unless asked', () => {
    render(
      <Stack testID="s">
        <Text>a</Text>
        <Text>b</Text>
      </Stack>,
    );
    expect(rules()).toHaveLength(0);
  });

  it('draws one between each pair, and none at the ends', () => {
    render(
      <Stack testID="s" divider>
        <Text>a</Text>
        <Text>b</Text>
        <Text>c</Text>
      </Stack>,
    );
    expect(rules()).toHaveLength(2);
  });

  it('is a horizontal line in a column', () => {
    render(
      <Stack testID="s" divider>
        <Text>a</Text>
        <Text>b</Text>
      </Stack>,
    );
    expect(rules()[0].height).toBe(TOKENS.dividerWidth);
  });

  it('is a vertical one in a row, stretched to the stack', () => {
    render(
      <Stack testID="s" direction="row" divider>
        <Text>a</Text>
        <Text>b</Text>
      </Stack>,
    );
    expect(rules()[0].width).toBe(TOKENS.dividerWidth);
    expect(rules()[0].alignSelf).toBe('stretch');
  });

  it('takes a node instead, for a divider that is content', () => {
    render(
      <Stack testID="s" divider={<Text>oppure</Text>}>
        <Text>a</Text>
        <Text>b</Text>
      </Stack>,
    );
    expect(screen.getByText('oppure')).toBeTruthy();
    expect(rules()).toHaveLength(0);
  });

  it('ignores a child that is not there, rather than dividing around it', () => {
    const show = false;
    render(
      <Stack testID="s" divider>
        <Text>a</Text>
        {show ? <Text>b</Text> : null}
        <Text>c</Text>
      </Stack>,
    );
    // Two children, so one rule: a conditional child that rendered
    // nothing must not leave a line with nothing on one side of it.
    expect(rules()).toHaveLength(1);
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [
      { name: 'admin', permissions: [{ resource: '*', action: '*' }] },
      { name: 'viewer', permissions: [{ resource: 'invoice', action: 'read' }] },
    ],
  };

  it('hides itself and everything in it when denied', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Stack access={{ resource: 'invoice', action: 'delete' }}>
          <Text>riservato</Text>
        </Stack>
      </RbacProvider>,
    );
    expect(screen.queryByText('riservato')).toBeNull();
  });

  it('honours visibleWhen', () => {
    render(
      <Stack visibleWhen={() => false}>
        <Text>nascosto</Text>
      </Stack>,
    );
    expect(screen.queryByText('nascosto')).toBeNull();
  });
});
