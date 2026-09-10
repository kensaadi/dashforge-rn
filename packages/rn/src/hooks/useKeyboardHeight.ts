import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * How tall the keyboard is right now, in points. `0` when it is away.
 *
 * **`will` on iOS and `did` on Android**, which is not a detail: iOS
 * announces the keyboard before it animates, so a layout that reacts to
 * `keyboardWillShow` travels with it instead of jumping after it.
 * Android has no `will` event at all, so there is nothing to choose.
 *
 * It reports the height on both platforms and leaves what to do about it
 * to the caller, because the answer differs: on Android the window has
 * usually been resized already under `adjustResize`, and a layout that
 * also moved itself would move twice.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const shown = Keyboard.addListener(showEvent, (event) => {
      setHeight(event.endCoordinates?.height ?? 0);
    });
    const hidden = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return height;
}
