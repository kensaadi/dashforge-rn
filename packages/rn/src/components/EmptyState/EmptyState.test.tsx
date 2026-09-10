import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { EmptyState } from './EmptyState';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).EmptyState.tokens;
const rootStyle = () => flat(screen.getByTestId('empty').props.style);

const Dot = ({ size, color }: { size?: number; color?: string }) => (
  <View testID="dot" style={{ width: size, backgroundColor: color }} />
);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('the words', () => {
  it('draws the title and the description', () => {
    render(
      <EmptyState testID="empty" title="Nessun ordine" description="Quando arriverà lo vedrai." />,
    );
    expect(screen.getByText('Nessun ordine')).toBeTruthy();
    expect(screen.getByText('Quando arriverà lo vedrai.')).toBeTruthy();
  });

  it('announces the title as a heading, since it is what the screen has to say', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" />);
    expect(screen.getByText('Nessun ordine').props.accessibilityRole).toBe('header');
  });

  it('leaves a node alone', () => {
    render(<EmptyState testID="empty" title={<Text testID="own">Nessun ordine</Text>} />);
    expect(screen.getByTestId('own')).toBeTruthy();
  });

  it('stops the words before they run the width of a tablet', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" />);
    const body = screen
      .UNSAFE_getAllByType(View)
      .map((v) => flat(v.props.style))
      .find((s) => s.maxWidth === TOKENS.maxWidth);
    expect(body).toBeTruthy();
  });
});

describe('the mark', () => {
  it('draws the icon at the token size', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" icon={Dot} />);
    expect(flat(screen.getByTestId('dot').props.style).width).toBe(TOKENS.iconSize);
  });

  it('gives the slot to the illustration and says so when both were given', () => {
    render(
      <EmptyState
        testID="empty"
        title="Nessun ordine"
        icon={Dot}
        illustration={<View testID="own" />}
      />,
    );
    expect(screen.getByTestId('own')).toBeTruthy();
    expect(screen.queryByTestId('dot')).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('both `illustration` and `icon`'),
    );
  });
});

describe('the tone', () => {
  it('is muted by default', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" icon={Dot} />);
    expect(flat(screen.getByTestId('dot').props.style).backgroundColor).toBe(
      semanticLight.text.muted,
    );
  });

  it('colours the mark when the nothing is a failure', () => {
    render(<EmptyState testID="empty" title="Non ho caricato" icon={Dot} tone="danger" />);
    expect(flat(screen.getByTestId('dot').props.style).backgroundColor).toBe(
      semanticLight.feedback.danger.fg,
    );
  });

  it('leaves the words alone, because a failed request is not an alarm', () => {
    // A page of red text reads like one. The title and the description
    // keep the colours every other piece of text on the screen has.
    render(
      <EmptyState testID="empty" title="Non ho caricato" description="Riprova." tone="danger" />,
    );
    expect(flat(screen.getByText('Non ho caricato').props.style).color).toBe(
      TOKENS.color.title,
    );
    expect(flat(screen.getByText('Riprova.').props.style).color).toBe(
      TOKENS.color.description,
    );
  });
});

describe('the space it takes', () => {
  it('is as tall as its content by default', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" />);
    expect(rootStyle().flex).toBeUndefined();
  });

  it('takes the room it was given and sits in the middle of it when told', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" fill />);
    expect(rootStyle().flex).toBe(1);
    expect(rootStyle().justifyContent).toBe('center');
  });
});

describe('the action', () => {
  it('draws whatever it was handed', () => {
    render(
      <EmptyState testID="empty" title="Nessun ordine" action={<Text testID="cta">Crea</Text>} />,
    );
    expect(screen.getByTestId('cta')).toBeTruthy();
  });

  it('draws nothing when there is nothing to offer', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" />);
    expect(screen.queryByTestId('cta')).toBeNull();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'order', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<EmptyState testID="empty" title="Nessun ordine" visibleWhen={() => false} />);
    expect(screen.queryByTestId('empty')).toBeNull();
  });

  it('is gone when access hides it', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <EmptyState
          testID="empty"
          title="Nessun ordine"
          access={{ resource: 'order', action: 'write' }}
        />
      </RbacProvider>,
    );
    expect(screen.queryByTestId('empty')).toBeNull();
  });
});
