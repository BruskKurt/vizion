import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../navigation/spatial'
import { profileStore } from '../profiles/store'
import { settingsStore } from '../profiles/settings'
import { ProfilesManager } from './ProfilesManager'

beforeAll(() => initSpatialNavigation())

beforeEach(() => {
  profileStore.profiles.value = [
    {
      id: 'p1',
      createdAt: 1,
      name: 'Salon',
      kind: 'xtream',
      host: 'http://example.test:8080',
      username: 'user',
      password: 'pass',
    },
  ]
  profileStore.liveProfileId.value = 'p1'
  profileStore.vodProfileId.value = 'p1'
  settingsStore.language.value = 'fr'
  settingsStore.languageSelected.value = true
})

describe('ProfilesManager', () => {
  it('rend les réglages dans un conteneur scrollable', () => {
    const { container } = render(<ProfilesManager embedded />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.height).toBe('100%')
    expect(root.style.overflowY).toBe('auto')
    expect(screen.getByText('Configuration')).toBeTruthy()
    expect(screen.getByText('Sources')).toBeTruthy()
    expect(screen.getByText('Lecture')).toBeTruthy()
  })

  it('applique thème et accent indépendamment et restaure le défaut', () => {
    render(<ProfilesManager embedded />)
    fireEvent.click(screen.getByRole('button', { name: 'Thèmes' }))
    expect(screen.queryByText('Configurer à distance')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Bleu nuit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Menthe' }))
    expect(settingsStore.theme.value).toBe('midnight')
    expect(settingsStore.accent.value).toBe('mint')
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer le thème par défaut' }))
    expect(settingsStore.theme.value).toBe('oled')
    expect(settingsStore.accent.value).toBe('ice')
  })

  it('permet de modifier la langue depuis les réglages', () => {
    render(<ProfilesManager embedded />)

    expect(screen.getByText('Langue')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Langue' }))
    fireEvent.click(screen.getAllByText('Español')[0])

    expect(settingsStore.language.value).toBe('es')
    expect(settingsStore.languageSelected.value).toBe(true)
  })
})
