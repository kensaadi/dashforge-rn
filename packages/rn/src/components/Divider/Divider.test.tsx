import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { defaultComponentTokens } from '../../tokens/components';
import { semanticLight } from '../../tokens/semantic';
import { Divider } from './Divider';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const TOKENS = defaultComponentTokens(semanticLight).Divider.tokens;

const lines = () =>
  screen
    .UNSAFE_getAllByType(View)
    .filter((v) => flat(v.props.style).backgroundColor === TOKENS.color);

/** The rule itself is hidden from the reader, so the query has to ask for it. */
const root = () => screen.getByTestId('divider', { includeHiddenElements: true });
const rootStyle = () => flat(root().props.style);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('the line', () => {
  it('is one hairline running across, by default', () => {
    render(<Divider testID="divider" />);
    expect(lines()).toHaveLength(1);
    const s = flat(lines()[0]!.props.style);
    expect(s.height).toBe(TOKENS.thickness);
    expect(s.alignSelf).toBe('stretch');
  });

  it('never sizes itself as a percentage of a parent it is stretching', () => {
    // A percentage resolves against a parent that is sizing itself to
    // this child, and Yoga breaks that circle by measuring the row as
    // unbounded: the rule ran the whole page and took the card with it.
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const { unmount } = render(<Divider testID="divider" orientation={orientation} />);
      const s = flat(lines()[0]!.props.style);
      expect(s.width).not.toBe('100%');
      expect(s.height).not.toBe('100%');
      unmount();
    }
  });

  it('runs the other way and takes the row height when vertical', () => {
    render(<Divider testID="divider" orientation="vertical" />);
    expect(flat(lines()[0]!.props.style).width).toBe(TOKENS.thickness);
    expect(flat(lines()[0]!.props.style).flex).toBe(1);
    expect(rootStyle().alignSelf).toBe('stretch');
  });

  it('uses the translucent separator, not a border colour', () => {
    render(<Divider testID="divider" />);
    expect(flat(lines()[0]!.props.style).backgroundColor).toBe(semanticLight.separator.default);
  });
});

describe('the air around it', () => {
  it('keeps it above and below when horizontal', () => {
    render(<Divider testID="divider" spacing="lg" />);
    expect(rootStyle().marginVertical).toBe(TOKENS.spacing.lg);
    expect(rootStyle().marginHorizontal).toBeUndefined();
  });

  it('keeps it either side when vertical', () => {
    render(<Divider testID="divider" orientation="vertical" spacing="sm" />);
    expect(rootStyle().marginHorizontal).toBe(TOKENS.spacing.sm);
    expect(rootStyle().marginVertical).toBeUndefined();
  });

  it('can be asked for none', () => {
    render(<Divider testID="divider" spacing="none" />);
    expect(rootStyle().marginVertical).toBe(0);
  });
});

describe('the label', () => {
  it('breaks the line in two and puts the words between them', () => {
    render(<Divider testID="divider" label="oppure" />);
    expect(screen.getByText('oppure')).toBeTruthy();
    expect(lines()).toHaveLength(2);
    expect(flat(lines()[0]!.props.style).flex).toBe(1);
  });

  it('lays the row out sideways so the words sit in the break', () => {
    render(<Divider testID="divider" label="oppure" />);
    expect(rootStyle().flexDirection).toBe('row');
  });

  it('leaves a node alone', () => {
    render(<Divider testID="divider" label={<Text testID="own">oppure</Text>} />);
    expect(screen.getByTestId('own')).toBeTruthy();
  });

  it('refuses it on a vertical rule, and says why', () => {
    render(<Divider testID="divider" orientation="vertical" label="oppure" />);
    expect(screen.queryByText('oppure', { includeHiddenElements: true })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no room for a word'));
  });
});

describe('what it tells a screen reader', () => {
  it('says nothing at all, because a bare rule is decoration', () => {
    render(<Divider testID="divider" />);
    expect(root().props.accessibilityElementsHidden).toBe(true);
  });

  it('keeps the label audible, because a word is not decoration', () => {
    // "oppure" is what tells somebody there is another way in. Hiding it
    // with the lines would take that from the people who cannot see the
    // lines in the first place.
    render(<Divider testID="divider" label="oppure" />);
    expect(root().props.accessibilityElementsHidden).toBe(false);
    expect(screen.getByText('oppure')).toBeTruthy();
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(<Divider testID="divider" visibleWhen={() => false} />);
    expect(screen.queryByTestId('divider', { includeHiddenElements: true })).toBeNull();
  });
});
