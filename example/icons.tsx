/**
 * A handful of glyphs drawn with plain views.
 *
 * Not what an app would do: an app installs an icon set. They are here
 * to show what the contract actually is, which is a component taking
 * `size` and `color` and nothing more. The library depends on no icon
 * package, and this file is the proof that it does not need one.
 */
import { View } from 'react-native';

type IconProps = { size?: number; color?: string };

const bar = (color: string, w: number, h: number, extra = {}) => ({
  position: 'absolute' as const,
  width: w,
  height: h,
  borderRadius: Math.min(w, h) / 2,
  backgroundColor: color,
  ...extra,
});

function Frame({
  size = 20,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

export function Plus({ size = 20, color = '#000' }: IconProps) {
  const t = Math.max(1.5, size * 0.1);
  return (
    <Frame size={size}>
      <View style={bar(color, size * 0.7, t)} />
      <View style={bar(color, t, size * 0.7)} />
    </Frame>
  );
}

export function Close({ size = 20, color = '#000' }: IconProps) {
  const t = Math.max(1.5, size * 0.1);
  return (
    <Frame size={size}>
      <View
        style={bar(color, size * 0.7, t, { transform: [{ rotate: '45deg' }] })}
      />
      <View
        style={bar(color, size * 0.7, t, { transform: [{ rotate: '-45deg' }] })}
      />
    </Frame>
  );
}

export function ChevronRight({ size = 20, color = '#000' }: IconProps) {
  const t = Math.max(1.5, size * 0.1);
  const l = size * 0.34;
  return (
    <Frame size={size}>
      <View
        style={bar(color, t, l, {
          transform: [{ translateY: -l * 0.35 }, { rotate: '-45deg' }],
        })}
      />
      <View
        style={bar(color, t, l, {
          transform: [{ translateY: l * 0.35 }, { rotate: '45deg' }],
        })}
      />
    </Frame>
  );
}

export function More({ size = 20, color = '#000' }: IconProps) {
  const d = Math.max(2.5, size * 0.15);
  const gap = size * 0.26;
  return (
    <Frame size={size}>
      <View style={bar(color, d, d, { transform: [{ translateX: -gap }] })} />
      <View style={bar(color, d, d)} />
      <View style={bar(color, d, d, { transform: [{ translateX: gap }] })} />
    </Frame>
  );
}

export function Search({ size = 20, color = '#000' }: IconProps) {
  const t = Math.max(1.5, size * 0.1);
  const r = size * 0.3;
  return (
    <Frame size={size}>
      <View
        style={{
          position: 'absolute',
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          borderWidth: t,
          borderColor: color,
          transform: [
            { translateX: -size * 0.06 },
            { translateY: -size * 0.06 },
          ],
        }}
      />
      <View
        style={bar(color, t, size * 0.32, {
          transform: [
            { translateX: size * 0.21 },
            { translateY: size * 0.21 },
            { rotate: '-45deg' },
          ],
        })}
      />
    </Frame>
  );
}

export function Trash({ size = 20, color = '#000' }: IconProps) {
  const t = Math.max(1.5, size * 0.09);
  return (
    <Frame size={size}>
      <View
        style={bar(color, size * 0.62, t, {
          transform: [{ translateY: -size * 0.24 }],
        })}
      />
      <View
        style={bar(color, size * 0.24, t, {
          transform: [{ translateY: -size * 0.36 }],
        })}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.46,
          height: size * 0.48,
          borderWidth: t,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          transform: [{ translateY: size * 0.06 }],
        }}
      />
    </Frame>
  );
}
