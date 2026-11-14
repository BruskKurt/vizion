import { isTheme, isAccent, type ThemeId, type AccentId } from '../appearance/themes'
import { batch, signal, type Signal } from '@preact/signals'
import * as storage from './storage'
import type { Channel } from '../data/models'
import { DEFAULT_LANGUAGE, isAppLanguage, type AppLanguage } from '../i18n/languages'

export interface LastWatched {
  channel: Channel
  categoryId: string
}

interface PersistedSettings {
  theme: ThemeId
  accent: AccentId
  resumeLastChannel: boolean
  livePreview: boolean
  lastWatched: Record<string, LastWatched>
  hiddenLiveCategoryIds: Record<string, string[]>
  language: AppLanguage
  languageSelected: boolean
}

export interface SettingsStore {
  theme: Signal<ThemeId>
  accent: Signal<AccentId>
  setAppearance(theme: ThemeId, accent: AccentId): void
  resumeLastChannel: Signal<boolean>
  /** Aperçu vidéo de la chaîne focalisée (ouvre un 2e flux IPTV). */
  livePreview: Signal<boolean>
  hiddenLiveCategoryIds: Signal<Record<string, string[]>>
  language: Signal<AppLanguage>
  languageSelected: Signal<boolean>
  setResumeLastChannel(value: boolean): void
  setLivePreview(value: boolean): void
  setLanguage(language: AppLanguage): void
  setLastWatched(profileId: string, channel: Channel, categoryId: string): void
  getLastWatched(profileId: string): LastWatched | null
  getHiddenLiveCategoryIds(profileId: string): string[]
  setLiveCategoryHidden(profileId: string, categoryId: string, hidden: boolean): void
  resetLiveCategoryVisibility(profileId: string): void
}

const KEY = 'settings'
const DEFAULTS: PersistedSettings = {
  theme: 'oled',
  accent: 'ice',
  resumeLastChannel: true,
  livePreview: false,
  lastWatched: {},
  hiddenLiveCategoryIds: {},
  language: DEFAULT_LANGUAGE,
  languageSelected: false,
}

export function createSettingsStore(): SettingsStore {
  const initial = storage.load<PersistedSettings>(KEY, DEFAULTS)
  const theme = signal<ThemeId>(isTheme(initial.theme) ? initial.theme : 'oled')
  const accent = signal<AccentId>(isAccent(initial.accent) ? initial.accent : 'ice')
  const resumeLastChannel = signal<boolean>(initial.resumeLastChannel ?? true)
  const livePreview = signal<boolean>(initial.livePreview ?? false)
  const lastWatched = signal<Record<string, LastWatched>>(initial.lastWatched ?? {})
  const hiddenLiveCategoryIds = signal<Record<string, string[]>>(initial.hiddenLiveCategoryIds ?? {})
  const language = signal<AppLanguage>(isAppLanguage(initial.language) ? initial.language : DEFAULT_LANGUAGE)
  const languageSelected = signal<boolean>(initial.languageSelected ?? false)

  function persist(appearance = { theme: theme.value, accent: accent.value }) {
    return storage.save<PersistedSettings>(KEY, {
      theme: appearance.theme,
      accent: appearance.accent,
      resumeLastChannel: resumeLastChannel.value,
      livePreview: livePreview.value,
      lastWatched: lastWatched.value,
      hiddenLiveCategoryIds: hiddenLiveCategoryIds.value,
      language: language.value,
      languageSelected: languageSelected.value,
    })
  }

  function withoutProfile(map: Record<string, string[]>, profileId: string): Record<string, string[]> {
    const next = { ...map }
    delete next[profileId]
    return next
  }

  return {
    theme,
    accent,
    setAppearance(nextTheme, nextAccent) {
      if (!isTheme(nextTheme) || !isAccent(nextAccent)) return
      if (!persist({ theme: nextTheme, accent: nextAccent })) throw new Error('Unable to save appearance')
      batch(() => {
        theme.value = nextTheme
        accent.value = nextAccent
      })
    },
    resumeLastChannel,
    livePreview,
    hiddenLiveCategoryIds,
    language,
    languageSelected,
    setResumeLastChannel(value) {
      resumeLastChannel.value = value
      persist()
    },
    setLivePreview(value) {
      livePreview.value = value
      persist()
    },
    setLanguage(nextLanguage) {
      language.value = nextLanguage
      languageSelected.value = true
      persist()
    },
    setLastWatched(profileId, channel, categoryId) {
      lastWatched.value = { ...lastWatched.value, [profileId]: { channel, categoryId } }
      persist()
    },
    getLastWatched(profileId) {
      return lastWatched.value[profileId] ?? null
    },
    getHiddenLiveCategoryIds(profileId) {
      return [...(hiddenLiveCategoryIds.value[profileId] ?? [])]
    },
    setLiveCategoryHidden(profileId, categoryId, hidden) {
      if (!profileId || !categoryId) return
      const cur = hiddenLiveCategoryIds.value[profileId] ?? []
      const next = hidden
        ? Array.from(new Set([...cur, categoryId]))
        : cur.filter((id) => id !== categoryId)
      if (next.length === 0) {
        hiddenLiveCategoryIds.value = withoutProfile(hiddenLiveCategoryIds.value, profileId)
      } else {
        hiddenLiveCategoryIds.value = { ...hiddenLiveCategoryIds.value, [profileId]: next }
      }
      persist()
    },
    resetLiveCategoryVisibility(profileId) {
      if (!profileId) return
      hiddenLiveCategoryIds.value = withoutProfile(hiddenLiveCategoryIds.value, profileId)
      persist()
    },
  }
}
