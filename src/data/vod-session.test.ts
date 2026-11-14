import { describe, it, expect } from 'vitest'
import { createVodSession } from './vod-session'
import type { Provider } from './provider'
import type { Profile } from './models'

function fakeProvider(): Provider & { calls: Record<string, number> } {
  const calls = { cat: 0, streams: 0, info: 0 }
  return {
    calls,
    async authenticate() { return { status: 'ok', expDate: null, maxConnections: 0, activeConnections: 0, allowedFormats: [] } },
    async getLiveCategories() { return [] },
    async getLiveStreams() { return [] },
    async getVodCategories() { calls.cat++; return [{ id: '1', name: 'Action', kind: 'movie' }] },
    async getVodStreams(categoryId) { calls.streams++; return [{ id: 'm' + (categoryId ?? 'all'), name: 'Film' }] },
    async getVodInfo(id) { calls.info++; return { id } },
    async getSeriesCategories() { return [] },
    async getSeries() { return [] },
    async getSeasons() { return [] },
    async getShortEpg() { return [] },
    buildStreamUrl() { return 'url' },
  }
}

const profile = (id: string): Profile => ({ id, name: id, kind: 'm3u', m3uUrl: 'x', createdAt: 0 })

describe('createVodSession', () => {
  it('mémoïse les catégories (provider appelé une seule fois)', async () => {
    const prov = fakeProvider()
    const s = createVodSession(() => profile('p1'), () => prov)
    await s.categories()
    await s.categories()
    expect(prov.calls.cat).toBe(1)
  })

  it('mémoïse les streams par catégorie', async () => {
    const prov = fakeProvider()
    const s = createVodSession(() => profile('p1'), () => prov)
    await s.streams('1')
    await s.streams('1')
    await s.streams('2')
    expect(prov.calls.streams).toBe(2)
  })

  it('mémoïse info par id', async () => {
    const prov = fakeProvider()
    const s = createVodSession(() => profile('p1'), () => prov)
    await s.info('77')
    await s.info('77')
    await s.info('88')
    expect(prov.calls.info).toBe(2)
  })

  it('recrée le provider et vide le cache au changement de profil', async () => {
    let active = profile('p1')
    let made = 0
    const s = createVodSession(() => active, () => { made++; return fakeProvider() })
    await s.categories()
    active = profile('p2')
    await s.categories()
    expect(made).toBe(2)
  })

  it('déduplique les appels concurrents (un seul fetch)', async () => {
    const prov = fakeProvider()
    const s = createVodSession(() => profile('p1'), () => prov)
    await Promise.all([s.categories(), s.categories()])
    expect(prov.calls.cat).toBe(1)
  })

  it('streams avec catégorie vide retourne tous les films', async () => {
    const prov = fakeProvider()
    const s = createVodSession(() => profile('p1'), () => prov)
    const result = await s.streams('')
    expect(result).toEqual([{ id: 'mall', name: 'Film' }])
  })

  it('retourne [] sans profil actif', async () => {
    const s = createVodSession(() => null, () => fakeProvider())
    expect(await s.categories()).toEqual([])
    expect(await s.streams('1')).toEqual([])
    expect(await s.info('1')).toEqual({ id: '1' })
  })
})
