import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../navigation/spatial'
import { profileStore } from '../profiles/store'
import { settingsStore } from '../profiles/settings'
import { PlaylistSettings } from './PlaylistSettings'

beforeAll(() => initSpatialNavigation())
beforeEach(() => {
  localStorage.clear()
  settingsStore.language.value = 'fr'
  profileStore.replaceConfiguration({ profiles: [
    { id: 'a', name: 'Salon', kind: 'm3u', m3uUrl: 'https://example.test/a.m3u', createdAt: 1 },
    { id: 'b', name: 'Cinéma', kind: 'm3u', m3uUrl: 'https://example.test/b.m3u', createdAt: 2 },
  ], liveId: 'a', vodId: 'a' })
})
const mount = () => render(<PlaylistSettings onAdd={vi.fn()} onEdit={vi.fn()} />)

describe('playlist settings', () => {
  it('choisit explicitement une source sans modifier l’autre', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: /Films et séries\s*Salon/ }))
    expect(profileStore.vodProfileId.value).toBe('a')
    fireEvent.click(screen.getByRole('button', { name: 'Cinéma' }))
    expect(profileStore.vodProfileId.value).toBe('b')
    expect(profileStore.liveProfileId.value).toBe('a')
    expect(screen.getByText('Vos playlists')).toBeTruthy()
  })
  it('permet de revenir sans changer la source', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: /Direct\s*Salon/ }))
    fireEvent.click(screen.getByRole('button', { name: '← Retour' }))
    expect(profileStore.liveProfileId.value).toBe('a')
  })
  it('ne supprime qu’après confirmation et réattribue les sources', () => {
    mount()
    expect(screen.queryByText('Supprimer la playlist')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Salon.*Gérer/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la playlist' }))
    expect(profileStore.profiles.value).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(profileStore.profiles.value).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la playlist' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la playlist' }))
    expect(profileStore.profiles.value.map(p => p.id)).toEqual(['b'])
    expect(profileStore.liveProfileId.value).toBe('b')
    expect(profileStore.vodProfileId.value).toBe('b')
  })
})
