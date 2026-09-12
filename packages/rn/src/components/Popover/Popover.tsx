import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useVisibility } from '../../hooks/useVisibility';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type { PopoverProps } from './popover.types';

/** Where the anchor is, in the window's own coordinates. */
interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where the panel goes, given the anchor and the room around it.
 *
 * Pulled out because it is the whole of a popover and the part that is
 * wrong in most of them: a panel centred on its anchor near the right
 * edge of a phone hangs off the screen, and one below an anchor near the
 * bottom opens into the keyboard.
 *
 * @internal
 */
export function place(
  anchor: Anchor,
  panel: { width: number; height: number },
  screen: { width: number; height: number },
  limits: { margin: number; offset: number },
  prefer: 'top' | 'bottom',
): { left: number; top: number; side: 'top' | 'bottom' } {
  const { margin, offset } = limits;

  const below = anchor.y + anchor.height + offset;
  const above = anchor.y - offset - panel.height;
  // The preferred side unless it does not fit and the other one does.
  // Not "unless it does not fit": with no room either way the preference
  // wins, because flipping into a worse fit helps nobody.
  const fitsBelow = below + panel.height + margin <= screen.height;
  const fitsAbove = above >= margin;
  const side =
    prefer === 'bottom' ? (fitsBelow || !fitsAbove ? 'bottom' : 'top')
    : fitsAbove || !fitsBelow ? 'top'
    : 'bottom';

  const centred = anchor.x + anchor.width / 2 - panel.width / 2;
  const left = Math.min(
    Math.max(centred, margin),
    Math.max(screen.width - panel.width - margin, margin),
  );

  return { left, top: side === 'bottom' ? below : above, side };
}

/**
 * A panel that comes out of something and points back at it.
 *
 * **It is not a dialog**, and the difference is the scrim: a dialog
 * darkens the page because the page can wait, and a popover leaves it
 * readable because the popover is about something on it. The layer
 * behind is transparent and exists only to catch the tap that closes it.
 *
 * It renders its anchor where it was written and measures it, rather
 * than asking for a ref. A ref that has to be threaded through is a ref
 * somebody forgets, and the failure is silent: a panel in the top-left
 * corner.
 *
 * **It flips when there is no room.** A panel below an anchor near the
 * bottom of a phone opens into the keyboard, and one centred on an
 * anchor near the right edge hangs off the screen. Both are arithmetic
 * and both are tested away from the component.
 *
 * @example
 * ```tsx
 * <Popover
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   anchor={<IconButton icon={More} onPress={() => setOpen(true)} accessibilityLabel="Altro" />}
 * >
 *   <Typography>Chi ha scritto questo lo sa.</Typography>
 * </Popover>
 * ```
 */
export function Popover(props: PopoverProps) {
  const themeDefaults = useComponentDefaults('Popover');
  const tokens = useComponentTokens('Popover');
  const screen = useWindowDimensions();

  const {
    anchor,
    children,
    open,
    onClose,
    placement = 'bottom',
    arrow = true,
    label,
    access,
    visibleWhen,
    sx,
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as PopoverProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const holder = useRef<ComponentRef<typeof View>>(null);
  const [at, setAt] = useState<Anchor | null>(null);
  const [panel, setPanel] = useState({ width: 0, height: 0 });

  // Measured when it opens and not before: an anchor inside a list has
  // moved by the time it is asked for, and a measurement taken at mount
  // would place the panel where the row used to be.
  useEffect(() => {
    if (!open) {
      setAt(null);
      return;
    }
    holder.current?.measureInWindow((x, y, width, height) => {
      setAt({ x, y, width, height });
    });
  }, [open]);

  const hidden = !isVisible || !accessState.visible;
  if (hidden) return null;

  const ready = at !== null && panel.width > 0 && panel.height > 0;
  const spot = ready
    ? place(
        at,
        panel,
        { width: screen.width, height: screen.height },
        { margin: tokens.screenMargin, offset: tokens.offset },
        placement,
      )
    : null;

  return (
    <>
      <View ref={holder} collapsable={false}>
        {anchor}
      </View>

      <RNModal
        transparent
        visible={open}
        // No animation of its own: a popover that faded would be a
        // dialog pretending not to be one, and the thing that makes it
        // read as attached is that it is simply there.
        animationType="none"
        onRequestClose={() => onClose?.()}
        statusBarTranslucent
      >
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={() => onClose?.()}
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.scrim }, sx?.scrim]}
        />

        <View
          accessibilityViewIsModal
          accessibilityLabel={label}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== panel.width || height !== panel.height) setPanel({ width, height });
          }}
          style={[
            {
              position: 'absolute',
              maxWidth: tokens.maxWidth,
              borderRadius: tokens.radius,
              padding: tokens.padding,
              backgroundColor: tokens.bg,
              ...tokens.elevation,
              // Off-screen until it has been measured. A panel drawn at
              // the top-left for one frame and then moved is the flicker
              // every popover in this language has.
              left: spot?.left ?? -9999,
              top: spot?.top ?? -9999,
              opacity: ready ? 1 : 0,
            },
            sx?.panel,
          ]}
        >
          {children}
        </View>

        {arrow && ready && at ? (
          <View
            // A square turned forty-five degrees, half of it under the
            // panel. Drawn outside the panel so the panel's own rounding
            // does not clip it.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              {
                position: 'absolute',
                width: tokens.arrow.size,
                height: tokens.arrow.size,
                backgroundColor: tokens.bg,
                transform: [{ rotate: '45deg' }],
                left: at.x + at.width / 2 - tokens.arrow.size / 2,
                top:
                  spot!.side === 'bottom'
                    ? spot!.top - tokens.arrow.size / 2
                    : spot!.top + panel.height - tokens.arrow.size / 2,
              },
              sx?.arrow,
            ]}
          />
        ) : null}
      </RNModal>
    </>
  );
}
