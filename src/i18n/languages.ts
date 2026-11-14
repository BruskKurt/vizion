export type AppLanguage = 'fr' | 'en' | 'es' | 'ar'

export const DEFAULT_LANGUAGE: AppLanguage = 'fr'

export const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; nativeName: string }> = [
  { code: 'fr', nativeName: 'Français' },
  { code: 'en', nativeName: 'English' },
  { code: 'es', nativeName: 'Español' },
  { code: 'ar', nativeName: 'العربية' },
]

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && LANGUAGE_OPTIONS.some((option) => option.code === value)
}
