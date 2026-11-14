import type { Provider } from '../provider'
import type { Category, Channel } from '../models'
import { proxify, fetchWithTimeout } from '../http'
import { type M3uEntry } from './m3u-parser'

import { parseM3uAsync } from './parse-async'

const UNCATEGORIZED = 'Autres'

export function createM3uProvider(m3uUrl: string): Provider {
  let entries: M3uEntry[] | null = null
  let channels: Channel[] = []
  let groups = new Map<string, Channel[]>()
  let loadedAt = 0
  let loading: Promise<M3uEntry[]> | null = null

  async function ensureLoaded(): Promise<M3uEntry[]> {
    if (entries && Date.now() - loadedAt < 5 * 60_000) return entries
    // Mutualise la requête en vol : les appels concurrents (authenticate +
    // getLiveCategories au démarrage) partagent un seul fetch.
    if (!loading) {
      if (!m3uUrl) throw new Error('URL M3U manquante')
      loading = (async () => {
        const text = await fetchWithTimeout(proxify(m3uUrl), async res => {
          if (!res.ok) throw new Error(`M3U HTTP ${res.status}`)
          return res.text()
        })
        const parsed = await parseM3uAsync(text)
        if (!parsed.length) throw new Error('Playlist M3U vide ou invalide')
        entries = parsed
        channels = parsed.map(toChannel)
        groups = new Map()
        for (const channel of channels) {
          const key = channel.categoryId!
          const group = groups.get(key) ?? []
          group.push(channel)
          groups.set(key, group)
        }
        loadedAt = Date.now()
        return parsed
      })().finally(() => {
        loading = null
      })
    }
    return loading
  }

  function toChannel(e: M3uEntry, index: number): Channel {
    // L'index garantit l'unicité de l'id même quand plusieurs entrées partagent
    // un même tvg-id (variantes SD/HD) ; epgChannelId conserve le tvg-id pour l'EPG.
    return {
      id: `${e.attrs['tvg-id'] || 'm3u'}-${index}`,
      name: e.name,
      logo: e.attrs['tvg-logo'] || undefined,
      categoryId: e.attrs['group-title'] || UNCATEGORIZED,
      epgChannelId: e.attrs['tvg-id'] || undefined,
      url: e.url,
    }
  }

  return {
    async authenticate() {
      await ensureLoaded()
      return { status: 'ok', expDate: null, maxConnections: 0, activeConnections: 0, allowedFormats: [] }
    },
    async getLiveCategories(): Promise<Category[]> {
      const list = await ensureLoaded()
      const names = new Set(list.map((e) => e.attrs['group-title'] || UNCATEGORIZED))
      return [...names].map((name) => ({ id: name, name, kind: 'live' as const }))
    },
    async getLiveStreams(categoryId): Promise<Channel[]> {
      await ensureLoaded()
      return categoryId ? groups.get(categoryId) ?? [] : channels
    },
    // M3U plat : VOD/séries non gérés en M1 (limite documentée).
    async getVodCategories() { return [] },
    async getVodStreams() { return [] },
    async getVodInfo(id: string) { return { id } },
    async getSeriesCategories() { return [] },
    async getSeries() { return [] },
    async getSeasons() { return [] },
    async getShortEpg() { return [] },
    buildStreamUrl(): string {
      throw new Error('M3U : utiliser channel.url (pas de buildStreamUrl)')
    },
  }
}
