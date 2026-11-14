import { describe, it, expect } from 'vitest'
import { createLiveSession } from './session'
import type { Provider } from './provider'
import type { Profile } from './models'

function fakeProvider(): Provider & { calls: Record<string, number> } {
  const calls = { cat: 0, streams: 0, epg: 0 }
  return {
    calls,
    async authenticate() { return { status: 'ok', expDate: null, maxConnections: 0, activeConnections: 0, allowedFormats: [] } },
    async getLiveCategories() { calls.cat++; return [{ id: '1', name: 'A', kind: 'live' }] },
    async getLiveStreams(categoryId) { calls.streams++; return [{ id: 'c' + (categoryId ?? 'all'), name: 'Ch' }] },
    async getVodCategories() { return [] },
    async getVodStreams() { return [] },
    async getVodInfo(id: string) { return { id } },
    async getSeriesCategories() { return [] },
    async getSeries() { return [] },
    async getSeasons() { return [] },
    async getShortEpg() { calls.epg++; return [{ title: 'P', start: 1, end: 2 }] },
    buildStreamUrl() { return 'url' },
  }
}

const profile = (id: string): Profile => ({ id, name: id, kind: 'm3u', m3uUrl: 'x', createdAt: 0 })

describe('createLiveSession', () => {
  it('mémoïse les catégories (provider appelé une seule fois)', async () => {
    const prov = fakeProvider()
    const s = createLiveSession(() => profile('p1'), () => prov)
    await s.categories()
    await s.categories()
    expect(prov.calls.cat).toBe(1)
  })

  it('mémoïse les chaînes par catégorie', async () => {
    const prov = fakeProvider()
    const s = createLiveSession(() => profile('p1'), () => prov)
    await s.channels('1')
    await s.channels('1')
    await s.channels('2')
    expect(prov.calls.streams).toBe(2)
  })

  it('recrée le provider et vide le cache au changement de profil', async () => {
    let active = profile('p1')
    let made = 0
    const s = createLiveSession(() => active, () => { made++; return fakeProvider() })
    await s.categories()
    active = profile('p2')
    await s.categories()
    expect(made).toBe(2)
  })

  it('nowNext tolère une erreur (-> []) et mémoïse (pas de re-fetch)', async () => {
    const prov = fakeProvider()
    let calls = 0
    prov.getShortEpg = async () => { calls++; throw new Error('boom') }
    const s = createLiveSession(() => profile('p1'), () => prov)
    expect(await s.nowNext('c1')).toEqual([])
    expect(await s.nowNext('c1')).toEqual([])
    expect(calls).toBe(1)
  })

  it('déduplique les appels concurrents (un seul fetch)', async () => {
    const prov = fakeProvider()
    const s = createLiveSession(() => profile('p1'), () => prov)
    await Promise.all([s.categories(), s.categories()])
    expect(prov.calls.cat).toBe(1)
  })

  it('provider() null sans profil actif', () => {
    const s = createLiveSession(() => null, () => fakeProvider())
    expect(s.provider()).toBeNull()
  })
})
