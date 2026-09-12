import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useAccessState } from '../../hooks/useAccessState';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useVisibility } from '../../hooks/useVisibility';
import { resolveTypeStyle } from '../../theme/typography';
import {
  useComponentDefaults,
  useComponentTokens,
} from '../../theme/useComponentTokens';
import type {
  AccordionItemProps,
  AccordionProps,
  AccordionValue,
} from './accordion.types';

const AccordionContext = createContext<{
  open: AccordionValue[];
  toggle: (value: AccordionValue) => void;
  disabled: boolean;
  divider: boolean;
  /** Whether this item is the first one still rendering, which draws no line. */
  claimFirst: (value: AccordionValue) => boolean;
} | null>(null);

/** @internal Used by `Accordion.Item`. */
function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(
      '[@dashforge/rn] <Accordion.Item> has to be inside an <Accordion>. It reads what is ' +
        'open from there, and on its own it has nothing to open.',
    );
  }
  return context;
}

/**
 * Questions with their answers folded away.
 *
 * `single` closes the others, which is what a list of questions wants:
 * one answer on screen and the rest within reach. `multiple` leaves that
 * to the reader, which is what a set of filters wants.
 *
 * The panel is **mounted when it opens and unmounted once it has
 * closed**, not kept around hidden. That is what makes the opening an
 * animation rather than a jump: a panel is measured the frame it
 * appears, and the box around it grows from nothing to that. It also
 * means an accordion of twenty answers is twenty headers until somebody
 * asks for one.
 *
 * @example
 * ```tsx
 * <Accordion defaultValue={['spedizione']}>
 *   <Accordion.Item value="spedizione" title="Quanto ci mette?">
 *     <Typography>Due giorni lavorativi.</Typography>
 *   </Accordion.Item>
 *   <Accordion.Item value="reso" title="Posso rendere?">…</Accordion.Item>
 * </Accordion>
 * ```
 */
export function Accordion(props: AccordionProps) {
  const themeDefaults = useComponentDefaults('Accordion');

  const {
    children,
    type = 'single',
    value: controlledValue,
    defaultValue,
    onValueChange,
    divider = true,
    disabled = false,
    access,
    visibleWhen,
    sx,
    ...rest
    // Theme defaults fill only what the caller left undefined; an
    // explicit prop always wins.
  } = { ...themeDefaults, ...props } as AccordionProps;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const [ownValue, setOwnValue] = useState<AccordionValue[]>(defaultValue ?? []);
  const open = controlledValue ?? ownValue;

  // Which item drew the first line, reset on every render pass so an
  // item hidden by `access` hands the job to the one under it rather
  // than leaving a line at the top of the list.
  const firstSeen = useRef<AccordionValue | null>(null);
  firstSeen.current = null;

  const toggle = (value: AccordionValue) => {
    const isOpen = open.includes(value);
    const next =
      type === 'single'
        ? isOpen
          ? []
          : [value]
        : isOpen
          ? open.filter((v) => v !== value)
          : [...open, value];

    if (controlledValue === undefined) setOwnValue(next);
    onValueChange?.(next);
  };

  const claimFirst = (value: AccordionValue) => {
    if (firstSeen.current === null) firstSeen.current = value;
    return firstSeen.current === value;
  };

  if (!isVisible || !accessState.visible) return null;

  return (
    <AccordionContext.Provider
      value={{
        open,
        toggle,
        disabled: disabled || accessState.disabled || accessState.readonly,
        divider,
        claimFirst,
      }}
    >
      <View {...rest} style={sx?.root}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
}

/**
 * One question and its answer.
 *
 * @internal Reached as `Accordion.Item`.
 */
export function AccordionItem(props: AccordionItemProps) {
  const tokens = useComponentTokens('Accordion');
  const { open, toggle, disabled: groupDisabled, divider, claimFirst } = useAccordion();
  const reduceMotion = useReduceMotion();

  const {
    value,
    title,
    subtitle,
    icon: Icon,
    children,
    disabled = false,
    access,
    visibleWhen,
    sx,
  } = props;

  const isVisible = useVisibility(visibleWhen);
  const accessState = useAccessState(access);

  const isOpen = open.includes(value);
  /** The panel's own height, measured the frame it appears. */
  const [measured, setMeasured] = useState(0);
  /** Kept up while the closing animation runs, so it has something to shrink. */
  const [rendered, setRendered] = useState(isOpen);

  const height = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: isOpen ? 1 : 0,
      duration: reduceMotion ? 0 : tokens.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (isOpen) {
      setRendered(true);
      return;
    }

    if (reduceMotion) {
      height.setValue(0);
      setRendered(false);
      return;
    }

    Animated.timing(height, {
      toValue: 0,
      duration: tokens.duration,
      easing: Easing.out(Easing.cubic),
      // A height is a layout property and cannot be driven natively.
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [isOpen, reduceMotion, height, turn, tokens.duration]);

  // The measurement arrives a frame after the panel appears, which is
  // exactly when there is something to grow to.
  useEffect(() => {
    if (!isOpen || measured <= 0) return;
    if (reduceMotion) {
      height.setValue(measured);
      return;
    }
    Animated.timing(height, {
      toValue: measured,
      duration: tokens.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isOpen, measured, reduceMotion, height, tokens.duration]);

  if (!isVisible || !accessState.visible) return null;

  const inactive = disabled || groupDisabled || accessState.disabled || accessState.readonly;
  const first = claimFirst(value);

  const onPanelLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0 && next !== measured) setMeasured(next);
  };

  return (
    <View style={sx?.root}>
      {divider && !first ? (
        <View
          style={[
            { height: tokens.separator.thickness, backgroundColor: tokens.separator.color },
            sx?.separator,
          ]}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        // `expanded` and not `selected`: the header says whether the
        // answer under it is showing, which is a different thing from
        // being the chosen one of several.
        accessibilityState={{ expanded: isOpen, disabled: inactive }}
        disabled={inactive}
        onPress={() => toggle(value)}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.gap,
            minHeight: tokens.minHeight,
            paddingVertical: tokens.paddingVertical,
            paddingHorizontal: tokens.paddingHorizontal,
            backgroundColor:
              pressed && !inactive ? tokens.color.bgPressed : tokens.color.bg,
          },
          sx?.header,
        ]}
      >
        {Icon ? (
          <Icon
            size={18}
            color={inactive ? tokens.color.titleDisabled : tokens.color.title}
          />
        ) : null}

        <View style={{ flex: 1, gap: 2 }}>
          {typeof title === 'string' ? (
            <Text
              style={[
                {
                  ...resolveTypeStyle(tokens.typography.title),
                  color: inactive ? tokens.color.titleDisabled : tokens.color.title,
                },
                sx?.title,
              ]}
            >
              {title}
            </Text>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <Text
              style={[
                { ...resolveTypeStyle(tokens.typography.subtitle), color: tokens.color.subtitle },
                sx?.subtitle,
              ]}
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>

        <Animated.View
          // Two edges of a square, turned. Pointing down when the answer
          // is folded away and up when it is showing.
          style={[
            {
              width: tokens.chevron.size,
              height: tokens.chevron.size,
              borderRightWidth: tokens.chevron.thickness,
              borderBottomWidth: tokens.chevron.thickness,
              borderColor: inactive ? tokens.color.titleDisabled : tokens.chevron.color,
              transform: [
                {
                  rotate: turn.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['45deg', '225deg'],
                  }),
                },
              ],
            },
            sx?.chevron,
          ]}
        />
      </Pressable>

      {rendered ? (
        <Animated.View style={[{ height, overflow: 'hidden' }, sx?.panel]}>
          {/*
            Measured here rather than on the box that grows: the box's
            height is being animated, so asking it how tall it is would
            be asking it how tall it currently is on the way there.
          */}
          <View
            onLayout={onPanelLayout}
            accessibilityElementsHidden={!isOpen}
            importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              paddingHorizontal: tokens.paddingHorizontal,
              paddingBottom: tokens.panelPadding,
            }}
          >
            {children}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
AccordionItem.displayName = 'Accordion.Item';

Accordion.Item = AccordionItem;
