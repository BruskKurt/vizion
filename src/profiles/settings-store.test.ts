import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSettingsStore } from './settings-store'
import type { Channel } from '../data/models'

const ch: Channel = { id: 'c1', name: 'TF1' }

beforeEach(() => localStorage.clear())

describe('createSettingsStore', () => {
  it('resumeLastChannel vrai par défaut, modifiable + persistant', () => {
    const s = createSettingsStore()
    expect(s.resumeLastChannel.value).toBe(true)
    s.setResumeLastChannel(false)
    expect(s.resumeLastChannel.value).toBe(false)
    expect(createSettingsStore().resumeLastChannel.value).toBe(false)
  })

  it('utilise le français par défaut et persiste la langue choisie', () => {
    const s = createSettingsStore()
    expect(s.language.value).toBe('fr')
    expect(s.languageSelected.value).toBe(false)

    s.setLanguage('en')
    expect(s.language.value).toBe('en')
    expect(s.languageSelected.value).toBe(true)

    const next = createSettingsStore()
    expect(next.language.value).toBe('en')
    expect(next.languageSelected.value).toBe(true)
  })

  it('mémorise la dernière chaîne par profil', () => {
    const s = createSettingsStore()
    s.setLastWatched('p1', ch, 'cat3')
    expect(s.getLastWatched('p1')).toEqual({ channel: ch, categoryId: 'cat3' })
    expect(s.getLastWatched('p2')).toBeNull()
  })

  it('persiste la dernière chaîne entre instances', () => {
    const s = createSettingsStore()
    s.setLastWatched('p1', ch, 'cat3')
    expect(createSettingsStore().getLastWatched('p1')).toEqual({ channel: ch, categoryId: 'cat3' })
  })

  it('mémorise les catégories Direct masquées par profil', () => {
    const s = createSettingsStore()
    s.setLiveCategoryHidden('p1', 'sport', true)
    s.setLiveCategoryHidden('p1', 'news', true)
    s.setLiveCategoryHidden('p2', 'kids', true)
    expect(s.getHiddenLiveCategoryIds('p1')).toEqual(['sport', 'news'])
    expect(s.getHiddenLiveCategoryIds('p2')).toEqual(['kids'])

    s.setLiveCategoryHidden('p1', 'sport', false)
    expect(s.getHiddenLiveCategoryIds('p1')).toEqual(['news'])
  })

  it('réinitialise et persiste la visibilité des catégories Direct', () => {
    const s = createSettingsStore()
    s.setLiveCategoryHidden('p1', 'sport', true)
    expect(createSettingsStore().getHiddenLiveCategoryIds('p1')).toEqual(['sport'])

    s.resetLiveCategoryVisibility('p1')
    expect(s.getHiddenLiveCategoryIds('p1')).toEqual([])
    expect(createSettingsStore().getHiddenLiveCategoryIds('p1')).toEqual([])
  })
})


describe('appearance', () => {
  it('migre les anciens réglages et conserve les choix entre sessions', () => {
    localStorage.setItem('vizion:settings', JSON.stringify({ resumeLastChannel: false, language: 'es' }))
    const store = createSettingsStore()
    expect(store.theme.value).toBe('oled')
    expect(store.accent.value).toBe('ice')
    store.setAppearance('warm', 'gold')
    const reloaded = createSettingsStore()
    expect(reloaded.theme.value).toBe('warm')
    expect(reloaded.accent.value).toBe('gold')
    expect(reloaded.language.value).toBe('es')
    expect(reloaded.resumeLastChannel.value).toBe(false)
  })
  it('remplace les choix inconnus par les défauts', () => {
    localStorage.setItem('vizion:settings', JSON.stringify({ theme: 'unknown', accent: null }))
    expect(createSettingsStore().theme.value).toBe('oled')
    expect(createSettingsStore().accent.value).toBe('ice')
  })
  it('conserve le thème courant si le stockage échoue', () => {
    const store = createSettingsStore()
    const failing = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    try {
      expect(() => store.setAppearance('slate', 'coral')).toThrow()
      expect(store.theme.value).toBe('oled')
      expect(store.accent.value).toBe('ice')
    } finally { failing.mockRestore() }
  })
})
