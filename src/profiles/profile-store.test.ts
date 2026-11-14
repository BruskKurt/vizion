import { describe, it, expect, beforeEach } from 'vitest'
import { createProfileStore } from './profile-store'

beforeEach(() => localStorage.clear())

describe('createProfileStore', () => {
  it('démarre vide', () => {
    const s = createProfileStore()
    expect(s.profiles.value).toEqual([])
    expect(s.liveProfileId.value).toBeNull()
    expect(s.vodProfileId.value).toBeNull()
    expect(s.activeLiveProfile()).toBeNull()
    expect(s.activeVodProfile()).toBeNull()
  })

  it('le 1er profil ajouté devient source Direct ET Films', () => {
    const s = createProfileStore()
    const p = s.addProfile({ name: 'VIP', kind: 'xtream', host: 'http://h:8080', username: 'u', password: 'p' })
    expect(p.id).toBeTruthy()
    expect(s.liveProfileId.value).toBe(p.id)
    expect(s.vodProfileId.value).toBe(p.id)
    // 2e profil : n'écrase pas les sources existantes
    const p2 = s.addProfile({ name: 'VOD', kind: 'xtream', host: 'http://v:8080', username: 'u2', password: 'p2' })
    expect(s.liveProfileId.value).toBe(p.id)
    expect(s.vodProfileId.value).toBe(p.id)
    expect(p2.id).not.toBe(p.id)
  })

  it('setLiveProfile / setVodProfile indépendants', () => {
    const s = createProfileStore()
    const a = s.addProfile({ name: 'A', kind: 'm3u', m3uUrl: 'http://a' })
    const b = s.addProfile({ name: 'B', kind: 'm3u', m3uUrl: 'http://b' })
    s.setVodProfile(b.id)
    expect(s.activeLiveProfile()?.id).toBe(a.id)
    expect(s.activeVodProfile()?.id).toBe(b.id)
  })

  it('persiste profils + sources entre instances', () => {
    const s = createProfileStore()
    const a = s.addProfile({ name: 'A', kind: 'm3u', m3uUrl: 'http://a' })
    const b = s.addProfile({ name: 'B', kind: 'm3u', m3uUrl: 'http://b' })
    s.setVodProfile(b.id)
    const s2 = createProfileStore()
    expect(s2.profiles.value).toHaveLength(2)
    expect(s2.liveProfileId.value).toBe(a.id)
    expect(s2.vodProfileId.value).toBe(b.id)
  })

  it('updateProfile applique un patch et persiste', () => {
    const s = createProfileStore()
    const p = s.addProfile({ name: 'Old', kind: 'm3u', m3uUrl: 'http://h' })
    s.updateProfile(p.id, { name: 'New' })
    expect(s.profiles.value[0].name).toBe('New')
    expect(createProfileStore().profiles.value[0].name).toBe('New')
  })

  it('removeProfile retire et réassigne les sources au profil restant', () => {
    const s = createProfileStore()
    const a = s.addProfile({ name: 'A', kind: 'm3u', m3uUrl: 'http://a' })
    const b = s.addProfile({ name: 'B', kind: 'm3u', m3uUrl: 'http://b' })
    s.setVodProfile(b.id)
    s.removeProfile(b.id) // b était la source Films
    expect(s.profiles.value).toHaveLength(1)
    expect(s.vodProfileId.value).toBe(a.id)
    expect(s.liveProfileId.value).toBe(a.id)
    s.removeProfile(a.id)
    expect(s.profiles.value).toEqual([])
    expect(s.liveProfileId.value).toBeNull()
    expect(s.vodProfileId.value).toBeNull()
  })

  it('migre l\'ancien activeId (mono-compte) vers live + vod', () => {
    // Simule un état persisté de l'ancienne version.
    localStorage.setItem('vizion:profiles', JSON.stringify({
      profiles: [{ id: 'x', name: 'X', kind: 'm3u', m3uUrl: 'http://x', createdAt: 1 }],
      activeId: 'x',
    }))
    const s = createProfileStore()
    expect(s.liveProfileId.value).toBe('x')
    expect(s.vodProfileId.value).toBe('x')
  })
})
