import { sv, svSlots } from '../sv';

describe('sv', () => {
  const button = sv({
    base: { flexDirection: 'row', borderRadius: 8 },
    variants: {
      variant: { solid: { borderWidth: 0 }, outline: { borderWidth: 1 } },
      color: { primary: {}, danger: {} },
      size: { sm: { minHeight: 36 }, md: { minHeight: 44 } },
      fullWidth: { true: { alignSelf: 'stretch' }, false: {} },
    },
    compoundVariants: [
      { variant: 'solid', color: 'primary', style: { backgroundColor: '#2344ca' } },
      { variant: 'solid', color: 'danger', style: { backgroundColor: '#ca2823' } },
      { variant: 'outline', color: 'primary', style: { borderColor: '#2344ca' } },
    ],
    defaultVariants: {
      variant: 'solid',
      color: 'primary',
      size: 'md',
      fullWidth: false,
    },
  });

  it('applies base, variants and matching compounds', () => {
    expect(button({ variant: 'solid', color: 'danger', size: 'sm' })).toMatchObject({
      flexDirection: 'row',
      borderRadius: 8,
      borderWidth: 0,
      minHeight: 36,
      backgroundColor: '#ca2823',
    });
  });

  it('falls back to defaultVariants for every axis left out', () => {
    expect(button()).toMatchObject({ minHeight: 44, backgroundColor: '#2344ca' });
  });

  it('ignores compounds whose selector does not match on every key', () => {
    const outline = button({ variant: 'outline', color: 'danger' });
    expect(outline).not.toHaveProperty('backgroundColor');
    expect(outline).not.toHaveProperty('borderColor');
    expect(outline).toMatchObject({ borderWidth: 1 });
  });

  it('lets a compound win over the axis styles it overlaps', () => {
    // Declaration order is the contract: base, then axes, then compounds.
    expect(button({ variant: 'outline', color: 'primary' })).toMatchObject({
      borderWidth: 1,
      borderColor: '#2344ca',
    });
  });

  it('accepts a real boolean on a true/false axis', () => {
    expect(button({ fullWidth: true })).toMatchObject({ alignSelf: 'stretch' });
    expect(button({ fullWidth: false })).not.toHaveProperty('alignSelf');
  });

  describe('caching', () => {
    it('returns the identical object for the same combination', () => {
      // The point of the engine: rendering is a lookup, so the same props
      // must not produce a fresh object every render or every consumer
      // memo comparison downstream breaks.
      expect(button({ size: 'sm' })).toBe(button({ size: 'sm' }));
    });

    it('is insensitive to the order the props are written in', () => {
      expect(button({ size: 'sm', color: 'danger' })).toBe(
        button({ color: 'danger', size: 'sm' }),
      );
    });

    it('treats an explicit default as the same entry as an omission', () => {
      expect(button({})).toBe(
        button({ size: 'md', variant: 'solid', color: 'primary' }),
      );
    });

    it('separates combinations that genuinely differ', () => {
      expect(button({ size: 'sm' })).not.toBe(button({ size: 'md' }));
    });
  });
});

describe('svSlots', () => {
  const field = svSlots({
    slots: {
      root: { gap: 4 },
      label: { fontWeight: '500' },
      input: { minHeight: 44 },
    },
    variants: {
      size: {
        sm: { input: { minHeight: 36 }, label: { fontSize: 13 } },
        md: { input: { minHeight: 44 }, label: { fontSize: 15 } },
      },
      invalid: { true: { input: { borderColor: '#ca2823' } }, false: {} },
    },
    compoundVariants: [
      { size: 'sm', invalid: true, style: { label: { color: '#ca2823' } } },
    ],
    defaultVariants: { size: 'md', invalid: false },
  });

  it('resolves every slot', () => {
    const s = field({ size: 'sm' });
    expect(s.root).toMatchObject({ gap: 4 });
    expect(s.label).toMatchObject({ fontWeight: '500', fontSize: 13 });
    expect(s.input).toMatchObject({ minHeight: 36 });
  });

  it('routes a compound to the slot it names and no other', () => {
    const s = field({ size: 'sm', invalid: true });
    expect(s.label).toMatchObject({ color: '#ca2823' });
    expect(s.input).toMatchObject({ borderColor: '#ca2823' });
    expect(s.root).not.toHaveProperty('color');
  });

  it('caches the whole slot set together', () => {
    expect(field({ size: 'sm' })).toBe(field({ size: 'sm' }));
  });
});
