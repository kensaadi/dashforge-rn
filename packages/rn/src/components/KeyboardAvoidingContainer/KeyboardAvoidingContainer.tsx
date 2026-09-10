import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import type { KeyboardAvoidingContainerProps } from './keyboardAvoidingContainer.types';

/**
 * A screen that stays out of the keyboard's way.
 *
 * **The two platforms do not want the same thing, and giving them the
 * same thing is the bug.** Android resizes the window itself under the
 * default `adjustResize`, so adding padding on top of that pushes the
 * content up twice and leaves a band of empty screen above the keyboard.
 * iOS does nothing on its own and needs the padding. So the behaviour is
 * `padding` there and nothing here, which is the whole reason this is a
 * component rather than a line at each call site.
 *
 * It **scrolls by default**, and with the settings a form actually
 * needs: a tap reaches the button it landed on rather than only
 * dismissing the keyboard, dragging the page puts the keyboard away, and
 * on iOS the scroll view takes its inset from UIKit and scrolls the
 * focused field into view.
 *
 * That last one is what makes it work in the hard case. The avoiding
 * view measures itself in JavaScript, and inside a `Modal` it measures
 * against the wrong window: a form in a `BottomSheet` stayed exactly
 * where it was, under the keyboard. Asking UIKit for the inset needs no
 * measurement, and it also scrolls to the caret, which the avoiding view
 * never did. **A container with `scroll={false}` inside a modal is still
 * on the avoiding view alone, and still has that limit.**
 *
 * **It has no tokens.** There is nothing here to theme: this is
 * behaviour, and behaviour is the platform's, which is bucket two in
 * ARCHITECTURE.md. The one number it takes is the height of whatever
 * sits above it, and only the caller knows that.
 *
 * @example
 * ```tsx
 * <KeyboardAvoidingContainer offset={insets.top + 56}>
 *   <TextField name="email" label="Email" />
 *   <Textarea name="note" label="Note" />
 *   <Button onPress={submit}>Salva</Button>
 * </KeyboardAvoidingContainer>
 *
 * <KeyboardAvoidingContainer scroll={false}>
 *   <FlatList keyboardShouldPersistTaps="handled" … />
 * </KeyboardAvoidingContainer>
 * ```
 */
export function KeyboardAvoidingContainer(props: KeyboardAvoidingContainerProps) {
  const { children, offset = 0, scroll = true, access, visibleWhen, sx } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  if (!isVisible || !accessState.visible) return null;

  return (
    <KeyboardAvoidingView
      // Nothing on Android: the window has already been resized, and
      // padding on top of that is the band of dead screen everybody has
      // seen at least once.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
      // It has to fill something for the padding to have anywhere to
      // come from. A container that wrapped its content would move
      // nothing.
      style={[{ flex: 1 }, sx?.root]}
    >
      {scroll ? (
        <ScrollView
          // `handled` and not `always`: a tap on a button reaches the
          // button instead of being spent dismissing the keyboard, while
          // a tap on the background still dismisses. `always` would keep
          // the keyboard up forever.
          keyboardShouldPersistTaps="handled"
          // Dragging the page puts the keyboard away, which is what
          // every native screen does and what a page that does not do it
          // feels wrong for.
          keyboardDismissMode="on-drag"
          // The part that actually works everywhere.
          //
          // `KeyboardAvoidingView` measures itself in JavaScript and
          // adds padding, and inside a `Modal` that measurement is
          // against the wrong window: a form in a `BottomSheet` sat
          // exactly where it had been, under the keyboard. This asks
          // UIKit for the inset instead, which needs no measurement, and
          // it scrolls the focused field into view rather than only
          // making room, which the avoiding view never did.
          //
          // iOS only, and nothing is lost on Android: the window has
          // already been resized there.
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={sx?.content}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}
