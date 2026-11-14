export const THEMES = ['oled', 'slate', 'midnight', 'warm'] as const
export const ACCENTS = ['ice', 'mint', 'gold', 'coral', 'lavender'] as const
export type ThemeId = typeof THEMES[number]
export type AccentId = typeof ACCENTS[number]
export const accentColors: Record<AccentId, string> = {
  ice: '#78d4ff', mint: '#7ee2b8', gold: '#f5ce78', coral: '#ffaaa0', lavender: '#c8b6ff',
}
export const themeColors: Record<ThemeId, { bg: string; elevated: string; panel: string; surface: string }> = {
  oled: { bg: '#000000', elevated: '#080808', panel: '#101010', surface: '#171717' },
  slate: { bg: '#16191e', elevated: '#1c2027', panel: '#232831', surface: '#2b323c' },
  midnight: { bg: '#071323', elevated: '#0c1c30', panel: '#12263e', surface: '#1b324c' },
  warm: { bg: '#191310', elevated: '#211a16', panel: '#2c231c', surface: '#382d24' },
}
export function isTheme(value: unknown): value is ThemeId { return THEMES.includes(value as ThemeId) }
export function isAccent(value: unknown): value is AccentId { return ACCENTS.includes(value as AccentId) }
export function applyAppearance(root: HTMLElement, theme: ThemeId, accent: AccentId) {
  const colors = themeColors[theme]
  const color = accentColors[accent]
  root.dataset.theme = theme
  root.dataset.accent = accent
  for (const [key, value] of Object.entries({
    bg: colors.bg, 'bg-elevated': colors.elevated, panel: colors.panel, surface: colors.surface,
    accent: color, 'focus-border': color, 'focus-bg': colors.surface, 'active-bg': colors.panel,
    'accent-soft': `${color}26`,
  })) root.style.setProperty(`--${key}`, value)
}
