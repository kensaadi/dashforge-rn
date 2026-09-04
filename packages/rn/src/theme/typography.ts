import { PixelRatio, type TextStyle } from 'react-native';
import type { TypeStyle } from '../tokens/types';

/**
 * Turn a type token into a React Native text style.
 *
 * The one thing that actually has to happen here: **line height is a
 * ratio in the token and an absolute number in the style**, multiplied
 * by the reader's text-size setting. React Native scales `fontSize` when
 * the setting is raised but leaves `lineHeight` untouched, so a stored
 * absolute value produces overlapping lines at exactly the moment
 * somebody needed the text bigger.
 *
 * `maxFontSizeMultiplier` is not a style but a `<Text>` prop, so it is
 * returned separately and applied by the caller. It is used here only to
 * cap the same scale the platform will apply, keeping the two in step.
 *
 * Known limit: `getFontScale()` is read at resolve time. A reader who
 * changes the system setting while the app is foregrounded sees the new
 * size (the platform scales `fontSize`) with the previous line height
 * until the next theme resolution.
 */
export function resolveTypeStyle(style: TypeStyle): TextStyle {
  const cap = style.maxFontSizeMultiplier ?? Number.POSITIVE_INFINITY;
  const scale = Math.min(PixelRatio.getFontScale(), cap);
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: Math.round(style.fontSize * style.lineHeight * scale),
  };
}
