import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { KeyboardAvoidingContainer } from './KeyboardAvoidingContainer';

const avoider = () => screen.UNSAFE_getByType(KeyboardAvoidingView);

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

beforeEach(() => setMode('light'));
afterEach(() => {
  (Platform as { OS: string }).OS = 'ios';
});

describe('the two platforms', () => {
  it('pads on iOS, which does nothing on its own', () => {
    (Platform as { OS: string }).OS = 'ios';
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(avoider().props.behavior).toBe('padding');
  });

  it('does nothing on Android, which has already resized the window', () => {
    // Padding on top of `adjustResize` pushes the content up twice and
    // leaves a band of dead screen above the keyboard.
    (Platform as { OS: string }).OS = 'android';
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(avoider().props.behavior).toBeUndefined();
  });
});

describe('the room above the keyboard', () => {
  it('is none unless the caller says what is up there', () => {
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(avoider().props.keyboardVerticalOffset).toBe(0);
  });

  it('is the height of whatever does not move', () => {
    render(
      <KeyboardAvoidingContainer offset={96}>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(avoider().props.keyboardVerticalOffset).toBe(96);
  });
});

describe('the shape', () => {
  it('fills its parent, or the padding has nowhere to come from', () => {
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(flat(avoider().props.style).flex).toBe(1);
  });

  it('scrolls by default, because a screen that needs this is a tall one', () => {
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(1);
  });

  it('gets out of the way when the caller owns the scrolling', () => {
    render(
      <KeyboardAvoidingContainer scroll={false}>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
    expect(screen.getByText('x')).toBeTruthy();
  });
});

describe('the two settings a form actually needs', () => {
  it('lets a tap reach the button it landed on', () => {
    // `handled` and not `always`: a tap on a button reaches the button
    // instead of being spent dismissing the keyboard, while a tap on the
    // background still dismisses.
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(screen.UNSAFE_getByType(ScrollView).props.keyboardShouldPersistTaps).toBe(
      'handled',
    );
  });

  it('takes the inset from the platform rather than measuring itself', () => {
    // The avoiding view measures in JavaScript and inside a `Modal` it
    // measures against the wrong window: a form in a `BottomSheet` sat
    // where it was, under the keyboard. This needs no measurement and it
    // scrolls to the caret as well.
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(
      screen.UNSAFE_getByType(ScrollView).props.automaticallyAdjustKeyboardInsets,
    ).toBe(true);
  });

  it('puts the keyboard away when the page is dragged', () => {
    render(
      <KeyboardAvoidingContainer>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(screen.UNSAFE_getByType(ScrollView).props.keyboardDismissMode).toBe('on-drag');
  });
});

describe('the Dashforge props', () => {
  it('is gone when visibleWhen says so', () => {
    render(
      <KeyboardAvoidingContainer visibleWhen={() => false}>
        <Text>x</Text>
      </KeyboardAvoidingContainer>,
    );
    expect(screen.queryByText('x')).toBeNull();
  });
});
