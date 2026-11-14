import { describe, it, expect } from 'vitest'
import { createSeriesSession } from './series-session'
import type { Provider } from './provider'
import type { Profile } from './models'

function fakeProvider(): Provider & { calls: Record<string, number> } {
  const calls = { cat: 0, list: 0, seasons: 0 }
  return {
    calls,
    async authenticate() { return { status: 'ok', expDate: null, maxConnections: 0, activeConnections: 0, allowedFormats: [] } },
    async getLiveCategories() { return [] },
    async getLiveStreams() { return [] },
    async getVodCategories() { return [] },
    async getVodStreams() { return [] },
    async getVodInfo(id) { return { id } },
    async getSeriesCategories() { calls.cat++; return [{ id: '1', name: 'Drame', kind: 'series' }] },
    async getSeries(categoryId) { calls.list++; return [{ id: 's' + (categoryId ?? 'all'), name: 'Série' }] },
    async getSeasons(_seriesId) { calls.seasons++; return [{ seasonNumber: 1, episodes: [{ id: 'e1', title: 'Pilote', seasonNumber: 1, episodeNumber: 1 }] }] },
    async getShortEpg() { return [] },
    buildStreamUrl() { return 'url' },
  }
}

const profile = (id: string): Profile => ({ id, name: id, kind: 'm3u', m3uUrl: 'x', createdAt: 0 })

describe('createSeriesSession', () => {
  it('mémoïse les catégories (provider appelé une seule fois)', async () => {
    const prov = fakeProvider()
    const s = createSeriesSession(() => profile('p1'), () => prov)
    await s.categories()
    await s.categories()
    expect(prov.calls.cat).toBe(1)
  })

  it('mémoïse les séries par catégorie', async () => {
    const prov = fakeProvider()
    const s = createSeriesSession(() => profile('p1'), () => prov)
    await s.list('1')
    await s.list('1')
    await s.list('2')
    expect(prov.calls.list).toBe(2)
  })

  it('mémoïse les saisons par seriesId', async () => {
    const prov = fakeProvider()
    const s = createSeriesSession(() => profile('p1'), () => prov)
    await s.seasons('77')
    await s.seasons('77')
    await s.seasons('88')
    expect(prov.calls.seasons).toBe(2)
  })

  it('recrée le provider et vide le cache au changement de profil', async () => {
    let active = profile('p1')
    let made = 0
    const s = createSeriesSession(() => active, () => { made++; return fakeProvider() })
    await s.categories()
    active = profile('p2')
    await s.categories()
    expect(made).toBe(2)
  })

  it('déduplique les appels concurrents (un seul fetch)', async () => {
    const prov = fakeProvider()
    const s = createSeriesSession(() => profile('p1'), () => prov)
    await Promise.all([s.categories(), s.categories()])
    expect(prov.calls.cat).toBe(1)
  })

  it('list avec catégorie vide retourne toutes les séries', async () => {
    const prov = fakeProvider()
    const s = createSeriesSession(() => profile('p1'), () => prov)
    const result = await s.list('')
    expect(result).toEqual([{ id: 'sall', name: 'Série' }])
  })

  it('retourne [] sans profil actif', async () => {
    const s = createSeriesSession(() => null, () => fakeProvider())
    expect(await s.categories()).toEqual([])
    expect(await s.list('1')).toEqual([])
    expect(await s.seasons('1')).toEqual([])
  })

  it('provider() retourne null sans profil actif', () => {
    const s = createSeriesSession(() => null, () => fakeProvider())
    expect(s.provider()).toBeNull()
  })

  it('seasons retourne les saisons avec épisodes', async () => {
    const prov = fakeProvider()
    const s = createSeriesSession(() => profile('p1'), () => prov)
    const saisons = await s.seasons('s1')
    expect(saisons).toHaveLength(1)
    expect(saisons[0].seasonNumber).toBe(1)
    expect(saisons[0].episodes[0].title).toBe('Pilote')
  })
})
