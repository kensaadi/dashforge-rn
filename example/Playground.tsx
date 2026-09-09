/**
 * The playground.
 *
 * Two questions it exists to answer: does the same JSX hold up under
 * five different brands, and does light / dark cost anything at the call
 * site. Nothing here branches on the theme or the mode; every colour on
 * screen arrives through a token.
 *
 * The shell is built out of the library's own components wherever it
 * can be. Being the first consumer is the fastest way to notice
 * something missing.
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@dashforge/rn';
import { setMode, setTheme, useTheme, useThemeMode } from '@dashforge/rn/theme';
import { Drawer } from './Drawer';
import {
  AccessSection,
  ButtonSection,
  TextFieldSection,
  FormSection,
  CardSection,
  IconButtonSection,
  ModalSection,
  BottomSheetSection,
  DialogSection,
  StackSection,
  CheckboxSection,
  SwitchSection,
  RadioGroupSection,
  SelectSection,
  SurfaceSection,
  TokensSection,
  TypographySection,
  VisibleWhenSection,
} from './sections';
import { SurfaceViewport } from '@dashforge/rn';
import { DialogHost } from './dialogs';
import { THEMES, type ThemeKey } from './themes';

const SECTIONS = [
  { key: 'button', label: 'Button', render: () => <ButtonSection /> },
  {
    key: 'iconbutton',
    label: 'IconButton',
    render: () => <IconButtonSection />,
  },
  { key: 'textfield', label: 'TextField', render: () => <TextFieldSection /> },
  {
    key: 'typography',
    label: 'Typography',
    render: () => <TypographySection />,
  },
  { key: 'access', label: 'access', render: () => <AccessSection /> },
  {
    key: 'visibleWhen',
    label: 'visibleWhen',
    render: () => <VisibleWhenSection />,
  },
  { key: 'form', label: 'Payload', render: () => <FormSection /> },
  { key: 'card', label: 'Card', render: () => <CardSection /> },
  { key: 'stack', label: 'Stack', render: () => <StackSection /> },
  { key: 'checkbox', label: 'Checkbox', render: () => <CheckboxSection /> },
  { key: 'switch', label: 'Switch', render: () => <SwitchSection /> },
  { key: 'radio', label: 'RadioGroup', render: () => <RadioGroupSection /> },
  { key: 'select', label: 'Select', render: () => <SelectSection /> },
  { key: 'surface', label: 'Surface', render: () => <SurfaceSection /> },
  { key: 'modal', label: 'Modal', render: () => <ModalSection /> },
  { key: 'sheet', label: 'BottomSheet', render: () => <BottomSheetSection /> },
  { key: 'dialog', label: 'ask()', render: () => <DialogSection /> },
  { key: 'tokens', label: 'Token', render: () => <TokensSection /> },
] as const;

/**
 * The menu's shape, kept separate from the sections themselves so a
 * section can move between groups without touching what it renders.
 */
const GROUPS = [
  {
    label: 'Componenti',
    keys: [
      'button',
      'iconbutton',
      'textfield',
      'checkbox',
      'switch',
      'radio',
      'select',
      'typography',
      'card',
      'surface',
      'modal',
      'sheet',
      'dialog',
    ],
  },
  { label: 'Props Dashforge', keys: ['access', 'visibleWhen'] },
  { label: 'Form', keys: ['form'] },
  { label: 'Fondamenta', keys: ['stack', 'tokens'] },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export function Playground() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const mode = useThemeMode();
  const s = theme.semantic;

  const [menuOpen, setMenuOpen] = useState(false);
  const [section, setSection] = useState<SectionKey>('button');
  const [brand, setBrand] = useState<ThemeKey>('dashforge');

  const current = SECTIONS.find(x => x.key === section) ?? SECTIONS[0];

  const applyBrand = (key: ThemeKey) => {
    const entry = THEMES.find(t => t.key === key);
    if (!entry) return;
    setTheme(entry.themes.light);
    setTheme(entry.themes.dark);
    setBrand(key);
  };

  return (
    // Mounted once, at the root, empty until something asks. It renders
    // its children through, so it is a wrapper and not a place.
    <DialogHost bottomInset={insets.bottom}>
      <View style={{ flex: 1, backgroundColor: s.surface.base }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 12,
            paddingBottom: 10,
            backgroundColor: s.surface.raised,
            borderBottomColor: s.separator.opaque,
            borderBottomWidth: s.borderWidth.default,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apri il menu"
              onPress={() => setMenuOpen(true)}
              hitSlop={8}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={{
                    width: 18,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: s.text.primary,
                  }}
                />
              ))}
            </Pressable>
            <Typography variant="subtitle">{current.label}</Typography>
          </View>

          {/*
          Theme and mode stay in the header rather than becoming menu
          items. They are the context everything else is looked at in: if
          switching to dark means opening a menu, leaving the section you
          were studying and coming back, the comparison is gone.
        */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
              {THEMES.map(t => (
                <Pressable
                  key={t.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Tema ${t.label}`}
                  accessibilityState={{ selected: brand === t.key }}
                  hitSlop={8}
                  onPress={() => applyBrand(t.key)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: s.radius.pill,
                    backgroundColor: t.swatch,
                    borderWidth: brand === t.key ? 2 : 0,
                    borderColor: s.text.primary,
                  }}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'light'
                  ? 'Passa al tema scuro'
                  : 'Passa al tema chiaro'
              }
              hitSlop={8}
              onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
              style={{
                minHeight: 32,
                paddingHorizontal: 12,
                justifyContent: 'center',
                borderRadius: s.radius.control,
                borderWidth: s.borderWidth.default,
                borderColor: s.border.default,
                backgroundColor: s.action.secondary.bg,
              }}
            >
              <Typography variant="caption">
                {mode === 'light' ? 'Chiaro' : 'Scuro'}
              </Typography>
            </Pressable>
          </View>
        </View>

        {/*
        Wired so `Surface` has something to tell it when the user is
        scrolling. Without it every surface here would behave as
        `commit="immediate"` and warn about it.
      */}
        <SurfaceViewport>
          {scroll => (
            <ScrollView
              {...scroll}
              contentContainerStyle={{
                padding: s.space.inset,
                paddingBottom: insets.bottom + 48,
                gap: s.space.stack,
              }}
            >
              {current.render()}
            </ScrollView>
          )}
        </SurfaceViewport>

        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          groups={GROUPS.map(g => ({
            label: g.label,
            items: g.keys.map(k => {
              const s2 = SECTIONS.find(x => x.key === k);
              return { key: k as SectionKey, label: s2?.label ?? k };
            }),
          }))}
          active={section}
          onSelect={setSection}
        />
      </View>
    </DialogHost>
  );
}
