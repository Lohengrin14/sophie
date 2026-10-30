export const THEME_COOKIE = 'artist_theme'
export const DEFAULT_THEME = 'winter'
export const siteThemes = [
  {
    id: 'winter',
    name: { ru: 'Зима', en: 'Winter' },
    note: { ru: 'Холодный тёмный и ледяной голубой', en: 'Cool darks and ice blue' },
    scheme: 'dark',
    colors: {
      bg: '#1b1f26',
      header: '#14181f',
      surface: '#252c35',
      ink: '#e9edf1',
      muted: '#abb6c2',
      accent: '#c0d3e5',
      hover: '#dceafa',
      soft: '#303c4b',
      stage: '#282f39',
      line: '#424e5d',
      error: '#f0a295',
      onAccent: '#202a35',
    },
  },
  {
    id: 'autumn',
    name: { ru: 'Осень', en: 'Autumn' },
    note: { ru: 'Тёплый песок и терракота', en: 'Warm sand and terracotta' },
    scheme: 'light',
    colors: {
      bg: '#f1e8dc',
      header: '#e8dbca',
      surface: '#fcf5ea',
      ink: '#3a2e23',
      muted: '#675645',
      accent: '#86462e',
      hover: '#69301e',
      soft: '#e4d0bd',
      stage: '#e9dbc9',
      line: '#cdb89f',
      error: '#a3382d',
      onAccent: '#ffffff',
    },
  },
  {
    id: 'summer',
    name: { ru: 'Лето', en: 'Summer' },
    note: { ru: 'Чистый белый и чёрный', en: 'Pure white and black' },
    scheme: 'light',
    colors: {
      bg: '#ffffff',
      header: '#f5f5f5',
      surface: '#ffffff',
      ink: '#161616',
      muted: '#626262',
      accent: '#161616',
      hover: '#3c3c3c',
      soft: '#e9e9e9',
      stage: '#f3f3f3',
      line: '#d8d8d8',
      error: '#a3382d',
      onAccent: '#ffffff',
    },
  },
  {
    id: 'spring',
    name: { ru: 'Весна', en: 'Spring' },
    note: { ru: 'Светлый шалфей и молодая листва', en: 'Pale sage and new leaves' },
    scheme: 'light',
    colors: {
      bg: '#eff3eb',
      header: '#e3ebdc',
      surface: '#fafcf6',
      ink: '#2e392c',
      muted: '#596752',
      accent: '#4b6741',
      hover: '#354e2c',
      soft: '#dce7d4',
      stage: '#e4ebdc',
      line: '#ccd8c2',
      error: '#a3382d',
      onAccent: '#ffffff',
    },
  },
] as const
export type SiteTheme = (typeof siteThemes)[number]
export type ThemeId = SiteTheme['id']

// Existing preference cookies migrate to the closest seasonal palette.
const legacyThemes: Record<string, ThemeId> = {
  graphite: 'winter',
  ink: 'winter',
  mono: 'winter',
  mist: 'winter',
  paper: 'autumn',
  cream: 'summer',
  mineral: 'spring',
  sage: 'spring',
  blush: 'spring',
  olive: 'spring',
}
export function resolveTheme(value: unknown): SiteTheme {
  const id =
    typeof value === 'string' && Object.hasOwn(legacyThemes, value) ? legacyThemes[value] : value
  return siteThemes.find((theme) => theme.id === id) || siteThemes[0]
}
export function themeVariables(theme: SiteTheme): Record<string, string> {
  const c = theme.colors
  return {
    '--bg': c.bg,
    '--header-bg': c.header,
    '--surface': c.surface,
    '--ink': c.ink,
    '--muted': c.muted,
    '--accent': c.accent,
    '--accent-hover': c.hover,
    '--accent-soft': c.soft,
    '--art-stage': c.stage,
    '--line': c.line,
    '--error': c.error,
    '--on-accent': c.onAccent,
    colorScheme: theme.scheme,
  }
}
