import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataCache } from './cache'
import { createLiveSession } from './session'
import type { Provider } from './provider'
import type { Profile } from './models'
afterEach(() => vi.useRealTimers())
describe('bounded cache', () => {
  it('expires, deduplicates refresh and returns fresh data on next access', async () => {
    vi.useFakeTimers()
    const cache = new DataCache()
    const load = vi.fn().mockResolvedValueOnce(['old']).mockResolvedValue(['new'])
    await cache.get('a', load, 100)
    vi.advanceTimersByTime(101)
    expect(await cache.get('a', load, 100)).toEqual(['old'])
    expect(await cache.get('a', load, 100)).toEqual(['new'])
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('evicts least recently used data under entry and catalogue budgets', async () => {
    const cache = new DataCache(2, 3)
    const load = vi.fn().mockResolvedValue([1,2])
    await cache.get('a', load)
    await cache.get('b', load)
    await cache.get('a', load)
    expect(load).toHaveBeenCalledTimes(3)
  })
  it('does not let an old profile failure invalidate the new profile', async () => {
    let active: Profile = { id: 'a', name: 'A', kind: 'm3u', m3uUrl: 'https://a.test', createdAt: 0 }
    let reject!: (e: Error) => void
    const first = new Promise<never>((_, r) => { reject = r })
    const categories = vi.fn().mockReturnValueOnce(first).mockResolvedValue([])
    const make = vi.fn(() => ({ getLiveCategories: categories }) as unknown as Provider)
    const session = createLiveSession(() => active, make)
    const old = session.categories().catch(() => {})
    await Promise.resolve()
    active = { ...active, m3uUrl: 'https://b.test' }
    await session.categories()
    reject(new Error('old request')); await old
    await session.categories()
    expect(make).toHaveBeenCalledTimes(2)
    expect(categories).toHaveBeenCalledTimes(2)
  })
  it('refreshes EPG after its TTL even when the first request failed', async () => {
    vi.useFakeTimers()
    const epg = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{ title: 'Now', start: 1, end: 2 }])
    const session = createLiveSession(() => ({ id:'a', name:'A', kind:'m3u', createdAt:0 }), () => ({ getShortEpg: epg }) as unknown as Provider)
    expect(await session.nowNext('c')).toEqual([])
    vi.advanceTimersByTime(60001)
    expect(await session.nowNext('c')).toHaveLength(1)
  })
})
