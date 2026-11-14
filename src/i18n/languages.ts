export type AppLanguage = 'fr' | 'en' | 'es'

export const DEFAULT_LANGUAGE: AppLanguage = 'fr'

export const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; nativeName: string }> = [
  { code: 'fr', nativeName: 'Français' },
  { code: 'en', nativeName: 'English' },
  { code: 'es', nativeName: 'Español' },
]

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && LANGUAGE_OPTIONS.some((option) => option.code === value)
}
