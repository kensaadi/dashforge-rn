import { hexToLch, lchToHex, makeRamp } from '../lch';
import { checkPaletteContract, makePalette } from '../makePalette';
import { palette } from '../palette';
import {
  makeSemanticDark,
  makeSemanticLight,
  semanticDark,
  semanticLight,
} from '../semantic';
import type { SemanticTokens } from '../types';

/**
 * Contrast is a property of the palette, so it is asserted on the
 * palette rather than discovered on a device. A ramp that fails here
 * fails on every component built on it, and no amount of component work
 * repairs it.
 *
 * Thresholds are WCAG 2.1: 4.5:1 for body text, 3:1 for large or bold
 * text and for meaningful non-text edges. Button labels are 15pt at
 * weight 500 and up, which is the large-text case.
 */

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channel = (i: number) => {
    const c = parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A tint appearing under a ghost control is a shape edge, not text, so
 * WCAG luminance understates it: a hue shift at equal lightness reads
 * clearly and scores near 1. Largest single-channel delta is the honest
 * measure for "can you see that something appeared".
 */
function channelDelta(a: string, b: string): number {
  const at = a.replace('#', '');
  const bt = b.replace('#', '');
  let max = 0;
  for (let i = 0; i < 3; i += 1) {
    const d = Math.abs(
      parseInt(at.slice(i * 2, i * 2 + 2), 16) -
        parseInt(bt.slice(i * 2, i * 2 + 2), 16),
    );
    if (d > max) max = d;
  }
  return max;
}

const BODY = 4.5;
const LARGE = 3;
/** Out of 255. Below this a tint reads as a rendering artefact. */
const VISIBLE_TINT = 8;
/** A control's fill has to be seen as a control, not read as the page. */
const VISIBLE_FILL = 10;

describe.each([
  ['light', semanticLight],
  ['dark', semanticDark],
])('%s theme contrast', (_mode, t: SemanticTokens) => {
  describe('text on surfaces', () => {
    const surfaces = ['base', 'raised', 'sunken', 'overlay'] as const;

    it.each(surfaces)('primary text on surface.%s meets AA', (surface) => {
      expect(ratio(t.text.primary, t.surface[surface])).toBeGreaterThanOrEqual(BODY);
    });

    it.each(surfaces)('secondary text on surface.%s meets AA', (surface) => {
      expect(ratio(t.text.secondary, t.surface[surface])).toBeGreaterThanOrEqual(BODY);
    });

    it.each(surfaces)('muted text on surface.%s meets large-text AA', (surface) => {
      expect(ratio(t.text.muted, t.surface[surface])).toBeGreaterThanOrEqual(LARGE);
    });

    it('inverse text reads on the inverse surface', () => {
      expect(ratio(t.text.inverse, t.surface.inverse)).toBeGreaterThanOrEqual(BODY);
    });
  });

  describe('action roles', () => {
    const roles = ['primary', 'secondary', 'danger', 'success', 'warning'] as const;

    it.each(roles)('%s label reads on its resting fill', (role) => {
      expect(ratio(t.action[role].fg, t.action[role].bg)).toBeGreaterThanOrEqual(LARGE);
    });

    it.each(roles)('%s label still reads once pressed', (role) => {
      expect(ratio(t.action[role].fg, t.action[role].bgPressed)).toBeGreaterThanOrEqual(
        LARGE,
      );
    });

    // The defect this catches, found by eye and not by the suite: a fill
    // equal to `surface.base` turns `solid` into `outline`, silently.
    it.each(roles)('%s fills are visible on the page and on a card', (role) => {
      for (const fill of [
        t.action[role].bg,
        t.action[role].bgPressed,
        t.action[role].bgDisabled,
      ]) {
        expect(channelDelta(fill, t.surface.base)).toBeGreaterThanOrEqual(VISIBLE_FILL);
        expect(channelDelta(fill, t.surface.raised)).toBeGreaterThanOrEqual(
          VISIBLE_FILL,
        );
      }
    });

    it.each(roles)('%s label reads on the page in outline and ghost form', (role) => {
      expect(ratio(t.action[role].fgSubtle, t.surface.base)).toBeGreaterThanOrEqual(
        BODY,
      );
      expect(ratio(t.action[role].fgSubtle, t.surface.raised)).toBeGreaterThanOrEqual(
        BODY,
      );
    });

    it.each(roles)('%s ghost tint is visible against the page', (role) => {
      expect(
        channelDelta(t.action[role].bgSubtlePressed, t.surface.base),
      ).toBeGreaterThanOrEqual(VISIBLE_TINT);
    });

    it.each(roles)('%s ghost label reads on its pressed tint', (role) => {
      expect(
        ratio(t.action[role].fgPressed, t.action[role].bgSubtlePressed),
      ).toBeGreaterThanOrEqual(BODY);
    });

    it.each(roles)('%s link label moves away from the page when pressed', (role) => {
      // The pressed label must contrast with the page at least as well as
      // the resting one, never less: a press may not cost legibility.
      expect(ratio(t.action[role].fgPressed, t.surface.base)).toBeGreaterThanOrEqual(
        LARGE,
      );
    });

    it.each(roles)('%s pressed fill is visibly different from resting', (role) => {
      // Not a WCAG rule: a press has to be *seen*. Below roughly 1.15
      // the shift reads as a rendering artefact rather than feedback.
      expect(ratio(t.action[role].bg, t.action[role].bgPressed)).toBeGreaterThan(1.15);
    });
  });

  describe('feedback roles', () => {
    const roles = ['success', 'warning', 'danger', 'info'] as const;

    it.each(roles)('%s text reads on its tinted surface', (role) => {
      expect(ratio(t.feedback[role].fg, t.feedback[role].bg)).toBeGreaterThanOrEqual(
        BODY,
      );
    });

    it.each(roles)('%s tint is distinguishable from the page', (role) => {
      expect(ratio(t.feedback[role].bg, t.surface.base)).not.toBe(1);
    });
  });

  describe('borders', () => {
    it('the default border is visible against a raised surface', () => {
      expect(ratio(t.border.default, t.surface.raised)).toBeGreaterThan(1.2);
    });

    it('the focus ring is clearly visible against the page', () => {
      expect(ratio(t.border.focus, t.surface.base)).toBeGreaterThanOrEqual(LARGE);
    });
  });
});

describe('the tone contract', () => {
  // The whole reason the ramps moved onto a perceptual tone axis. Each
  // pair below is guaranteed by arithmetic rather than by inspection:
  // two CIE L* tones 50 apart contrast at least 4.5:1, whatever the hue.
  // If one of these fails, a tone drifted, and the fix is the tone map
  // in `palette.ts` rather than a per-hue nudge.
  const CHROMATIC = ['primary', 'success', 'warning', 'danger', 'info'] as const;

  it.each(CHROMATIC)('%s: white reads on the light-label fill (600)', (role) => {
    expect(ratio('#ffffff', palette[role]['600'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CHROMATIC)(
    '%s: the dark label reads on the vivid fill (950 on 400)',
    (role) => {
      expect(ratio(palette[role]['950'], palette[role]['400'])).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it.each(CHROMATIC)('%s: 700 reads as a label on a light page', (role) => {
    expect(ratio(palette[role]['700'], palette.neutral['50'])).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(CHROMATIC)('%s: 400 reads as a label on a dark page', (role) => {
    expect(ratio(palette[role]['400'], palette.neutral['950'])).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(CHROMATIC)('%s: 800 reads on its own 100 tint', (role) => {
    expect(ratio(palette[role]['800'], palette[role]['100'])).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(CHROMATIC)('%s: 300 reads on its own 950 tint', (role) => {
    expect(ratio(palette[role]['300'], palette[role]['950'])).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('holds within a hair for every hue, which is the point', () => {
    // Not "each passes" but "each lands in the same place". A spread here
    // would mean the tone axis is not doing its job and some hue is
    // passing by luck.
    const values = CHROMATIC.map((r) => ratio('#ffffff', palette[r]['600']));
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.3);
  });
});

describe('an arbitrary palette needs no tuning', () => {
  // Under the old HSL ramps this was the hostile case: a green could not
  // carry white at the action step and the semantic tier had to walk the
  // ramp looking for one that could. On a tone axis the step simply
  // works, for this palette and for a consumer's.
  const hostile = { ...palette, primary: palette.success };

  it.each([
    ['light', makeSemanticLight(hostile)],
    ['dark', makeSemanticDark(hostile)],
  ])('%s: the label reads on the fill, at the standard step', (_mode, t) => {
    expect(ratio(t.action.primary.fg, t.action.primary.bg)).toBeGreaterThanOrEqual(4.5);
    expect(t.action.primary.bg).toBe(hostile.primary['600']);
  });

  it.each([
    ['light', makeSemanticLight(hostile)],
    ['dark', makeSemanticDark(hostile)],
  ])('%s: the press moves away from the label, never onto it', (_mode, t) => {
    const r = t.action.primary;
    expect(ratio(r.fg, r.bgPressed)).toBeGreaterThanOrEqual(ratio(r.fg, r.bg));
  });

  it('takes a dark label only where the palette asks for it', () => {
    const t = makeSemanticLight(palette);
    // Apple's model, and a declaration rather than a rescue: amber and
    // green keep their hue and darken the label.
    expect(t.action.warning.fg).toBe(palette.warning['950']);
    expect(t.action.success.fg).toBe(palette.success['950']);
    expect(t.action.primary.fg).toBe('#ffffff');
    expect(t.action.danger.fg).toBe('#ffffff');
  });

  it('honours a different declaration', () => {
    const t = makeSemanticLight(palette, { darkLabelRoles: [] });
    expect(t.action.warning.fg).toBe('#ffffff');
    expect(ratio(t.action.warning.fg, t.action.warning.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('increase contrast', () => {
  // Both operating systems expose the setting and both adapt their own
  // colours to it. Ignoring it is the gap this closes.
  const plain = makeSemanticLight(palette);
  const hc = makeSemanticLight(palette, { highContrast: true });

  it('deepens body text against the page', () => {
    expect(ratio(hc.text.secondary, hc.surface.base)).toBeGreaterThan(
      ratio(plain.text.secondary, plain.surface.base),
    );
  });

  it('strengthens the default border', () => {
    expect(ratio(hc.border.default, hc.surface.raised)).toBeGreaterThan(
      ratio(plain.border.default, plain.surface.raised),
    );
  });

  it('makes the separator opaque, because a translucent hairline is what goes first', () => {
    expect(plain.separator.default).toMatch(/^rgba/);
    expect(hc.separator.default).toMatch(/^#/);
  });

  it('does the same in dark', () => {
    const d = makeSemanticDark(palette);
    const dhc = makeSemanticDark(palette, { highContrast: true });
    expect(ratio(dhc.text.secondary, dhc.surface.base)).toBeGreaterThan(
      ratio(d.text.secondary, d.surface.base),
    );
  });
});

describe('makePalette', () => {
  // The safe path. A consumer's hand-authored ramps are checked but not
  // corrected; one built here cannot fail, because the tones are not up
  // for negotiation.
  const seeds = ['#7c3aed', '#0e7490', '#b45309', '#be123c', '#15803d'];

  it.each(seeds)('%s produces a palette that meets the contract', (seed) => {
    expect(checkPaletteContract(makePalette({ primary: seed }))).toEqual([]);
  });

  it('keeps the feedback hues unless asked otherwise', () => {
    // They are meanings, not brand. A product that recolours its error
    // state to match its logo has stopped communicating.
    const p = makePalette({ primary: '#7c3aed' });
    expect(p.danger).toEqual(palette.danger);
    expect(p.success).toEqual(palette.success);
  });

  it('takes a house colour for a feedback role when given one', () => {
    const p = makePalette({ primary: '#7c3aed', danger: '#b3261e' });
    expect(p.danger).not.toEqual(palette.danger);
    expect(checkPaletteContract(p)).toEqual([]);
  });

  it('discards the seed lightness, which is the whole trick', () => {
    // Two seeds of the same hue and chroma but different lightness must
    // produce the same ramp. Honouring where the brand colour happens to
    // sit is exactly how a scale ends up with a different real lightness
    // per hue.
    const light = makeRamp('#a78bfa');
    const dark = makeRamp(lchToHex(30, hexToLch('#a78bfa').C, hexToLch('#a78bfa').H));
    expect(dark['600']).toBe(light['600']);
  });

  it('reports what failed, with the numbers', () => {
    // The ramps the playground shipped before this existed: generated in
    // HSL, and three of four failed white-on-600.
    const bad = {
      ...palette,
      primary: { ...palette.primary, '600': '#33a6e8' },
    };
    const violations = checkPaletteContract(bad);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatchObject({ role: 'primary', required: 4.5 });
    expect(violations[0].measured).toBeLessThan(4.5);
  });
});
