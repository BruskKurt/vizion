export const THEMES = ['oled', 'slate', 'midnight', 'warm', 'plum', 'forest'] as const
export const ACCENTS = ['ice', 'mint', 'gold', 'coral', 'lavender'] as const
export type ThemeId = typeof THEMES[number]
export type AccentId = typeof ACCENTS[number]
export const accentColors: Record<AccentId, string> = {
  ice: '#78d4ff', mint: '#7ee2b8', gold: '#f5ce78', coral: '#ffaaa0', lavender: '#c8b6ff',
}
/** `text` teinte aussi les textes secondaires, filets et bordures du thème. */
export const themeColors: Record<ThemeId, { bg: string; elevated: string; panel: string; surface: string; text: string }> = {
  oled: { bg: '#000000', elevated: '#080808', panel: '#101010', surface: '#171717', text: '#ffffff' },
  slate: { bg: '#121519', elevated: '#181c22', panel: '#1f242c', surface: '#282e38', text: '#edf1f7' },
  midnight: { bg: '#060f1e', elevated: '#0b192d', panel: '#11233b', surface: '#1a2f4b', text: '#e8f0ff' },
  warm: { bg: '#17110d', elevated: '#1f1813', panel: '#2a201a', surface: '#362a21', text: '#fbf0e4' },
  plum: { bg: '#120b18', elevated: '#191020', panel: '#22172c', surface: '#2e2139', text: '#f6edfb' },
  forest: { bg: '#08120f', elevated: '#0d1915', panel: '#13231d', surface: '#1c2f27', text: '#e9f6ef' },
}
export function isTheme(value: unknown): value is ThemeId { return THEMES.includes(value as ThemeId) }
export function isAccent(value: unknown): value is AccentId { return ACCENTS.includes(value as AccentId) }
/** Mélange deux couleurs #rrggbb (t = part de `b`). color-mix() n'existe pas sur les anciens webOS. */
export function mix(a: string, b: string, t: number) {
  return '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t)
    .toString(16).padStart(2, '0')).join('')
}
export function applyAppearance(root: HTMLElement, theme: ThemeId, accent: AccentId) {
  const colors = themeColors[theme]
  const color = accentColors[accent]
  root.dataset.theme = theme
  root.dataset.accent = accent
  for (const [key, value] of Object.entries({
    bg: colors.bg, 'bg-elevated': colors.elevated, panel: colors.panel, surface: colors.surface,
    text: colors.text, 'text-dim': `${colors.text}ad`, 'text-faint': `${colors.text}70`,
    hairline: `${colors.text}1a`, 'glass-border': `${colors.text}24`,
    accent: color, 'focus-border': color, 'accent-soft': `${color}26`,
    // Focus et sélection prennent une teinte de l'accent au lieu d'un simple gris plus clair.
    'focus-bg': mix(colors.surface, color, 0.22), 'active-bg': mix(colors.panel, color, 0.1),
  })) root.style.setProperty(`--${key}`, value)
}
