import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import { useTheme } from '../../theme/useTheme';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import { CardContext, CardFooter, CardHeader } from '../Card/Card';
import type { ModalProps } from './modal.types';

/** Where the panel starts from. Small enough to read as settling. */
const ENTRY_SCALE = 0.96;

/**
 * A dialog: a panel over a darkened page.
 *
 * **Built on React Native's own `Modal`, unlike `Switch`.** That one was
 * refused because it exposed two colours and no geometry; this one is
 * infrastructure rather than appearance. It is what actually takes the
 * content out of the layout tree, answers Android's back button, and
 * puts the panel above the status bar. Refusing it would mean writing a
 * portal, and a portal we wrote would be a worse one.
 *
 * **It does not close itself.** The scrim and the back button call
 * `onClose` and nothing else happens until the caller says so, which
 * keeps the one piece of state that decides whether it is open in one
 * place.
 *
 * `Modal.Header` and `Modal.Footer` are `Card`'s own components. A
 * dialog's heading is a card's heading, and having two would mean two
 * things to keep in step; the panel lends them the card context so the
 * footer's rule bleeds to its edges exactly as it does in a card.
 *
 * **Tall content is the caller's to handle.** The panel stops growing at
 * a fraction of the screen and does not scroll itself: a scroll region
 * inside it would have to decide whether the footer scrolls with the
 * content, and that is a decision about the dialog rather than about
 * dialogs.
 *
 * @example
 * ```tsx
 * <Modal open={open} onClose={close} label="Elimina il progetto">
 *   <Modal.Header title="Elimina il progetto" subtitle="Non si torna indietro" />
 *   <Modal.Footer divider>
 *     <Button variant="ghost" color="secondary" onPress={close}>Annulla</Button>
 *     <Button color="danger" onPress={remove}>Elimina</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
export function Modal(props: ModalProps) {
  const themeDefaults = useComponentDefaults('Modal');
  const tokens = useComponentTokens('Modal');
  const theme = useTheme();

  const {
    open,
    onClose,
    dismissible = true,
    size = 'md',
    label,
    children,
    access,
    visibleWhen,
    sx,
  } = { ...themeDefaults, ...props } as ModalProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);
  const reduceMotion = useReduceMotion();
  const entry = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) {
      entry.setValue(0);
      return;
    }
    if (reduceMotion) {
      entry.setValue(1);
      return;
    }
    Animated.timing(entry, {
      toValue: 1,
      duration: theme.semantic.motion.standard,
      easing: Easing.out(Easing.cubic),
      // Only the panel moves, and only opacity and transform: those go
      // native, so the entrance survives a busy JS thread.
      useNativeDriver: true,
    }).start();
  }, [open, reduceMotion, entry, theme.semantic.motion.standard]);

  const hidden = !isVisible || !accessState.visible;
  const dismiss = () => {
    if (dismissible) onClose?.();
  };

  return (
    <RNModal
      transparent
      visible={open && !hidden}
      // The scrim's own fade is React Native's, because it is the whole
      // window and the exit has to finish before the modal unmounts.
      // Anything of ours would need an unmount delay to match it.
      animationType={reduceMotion ? 'none' : 'fade'}
      // Required on Android, where it is the back button. Called even
      // when the dialog is not dismissible, so `dismiss` decides.
      onRequestClose={dismiss}
      // Without this the scrim stops at the status bar on Android and
      // the page shows through the top of the screen.
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: tokens.margin,
        }}
      >
        <Pressable
          // Inert to assistive technology: it is a way to leave, not a
          // control, and announcing it would put a nameless button
          // between the reader and the dialog.
          accessible={false}
          importantForAccessibility="no"
          onPress={dismiss}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: tokens.scrim },
            sx?.scrim,
          ]}
        />
        <Animated.View
          // Hides everything behind it from VoiceOver, which is the part
          // that makes this a dialog rather than a view that happens to
          // be on top.
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[
            {
              width: '100%',
              maxWidth: tokens.maxWidth[size],
              maxHeight: `${tokens.maxHeightRatio * 100}%`,
              backgroundColor: tokens.bg,
              borderRadius: tokens.radius,
              padding: tokens.padding,
              gap: tokens.gap,
              ...tokens.elevation,
              opacity: entry,
              transform: [
                {
                  scale: entry.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ENTRY_SCALE, 1],
                  }),
                },
              ],
            },
            sx?.panel,
          ]}
        >
          <CardContext.Provider
            value={{
              padding: tokens.padding,
              radius: Math.max(tokens.radius, 0),
              tone: 'neutral',
              over: 'card',
            }}
          >
            {children}
          </CardContext.Provider>
        </Animated.View>
      </View>
    </RNModal>
  );
}

// The same components a card uses, named for where they are being used.
// A dialog's heading is a card's heading, and two of them would be two
// things to keep in step.
Modal.Header = CardHeader;
Modal.Footer = CardFooter;
