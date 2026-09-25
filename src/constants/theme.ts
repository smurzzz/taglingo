/**
 * TagLingo design tokens — ported from the web prototype's CSS variables
 * (warm cream canvas, sage/teal accent, ink type).
 */

export interface Palette {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  sage: string;
  sageSoft: string;
  flame: string;
  flameSoft: string;
  coral: string;
  coralSoft: string;
  honey: string;
  honeySoft: string;
  ink: string;
  inkSoft: string;
  stage: string;
  overlay: string;
}

export const Colors: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#FAF8F5',
    foreground: '#1B272D',
    card: '#FFFFFF',
    primary: '#51857B',
    primaryForeground: '#FCFBF8',
    muted: '#F2F1ED',
    mutedForeground: '#6A7981',
    accent: '#E9F1ED',
    accentForeground: '#2D584F',
    border: '#EAE7E1',
    sage: '#3B7267',
    sageSoft: '#E8F3EE',
    flame: '#B86B1E',
    flameSoft: '#FCF2DE',
    coral: '#BE3B2D',
    coralSoft: '#FBECE9',
    honey: '#9B7427',
    honeySoft: '#FBF2DA',
    ink: '#475C66',
    inkSoft: '#EDF1F2',
    stage: '#F1EFE9',
    overlay: '#0E161B',
  },
  dark: {
    background: '#12191C',
    foreground: '#F4F1EC',
    card: '#1B2327',
    primary: '#62A796',
    primaryForeground: '#131C20',
    muted: '#252D31',
    mutedForeground: '#9EACB3',
    accent: '#2B3B39',
    accentForeground: '#C3DFD6',
    border: '#2D3539',
    sage: '#A2CDBF',
    sageSoft: '#2A3C39',
    flame: '#E9B367',
    flameSoft: '#403326',
    coral: '#E29083',
    coralSoft: '#422C29',
    honey: '#E7CB7E',
    honeySoft: '#3D3629',
    ink: '#AEBBC2',
    inkSoft: '#2B3236',
    stage: '#0C1113',
    overlay: '#05080A',
  },
};

export type PaletteColor = keyof Palette;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  sheet: 32,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
  ten: 40,
  twelve: 48,
} as const;

export const Type = {
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.5 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  display: { fontSize: 28, lineHeight: 34, fontWeight: '600' as const },
  hero: { fontSize: 40, lineHeight: 46, fontWeight: '600' as const },
};
