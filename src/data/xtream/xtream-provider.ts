import type { Provider } from '../provider'
import type { Season, StreamKind } from '../models'
import { type XtreamCreds, fetchAuth, fetchAction, buildStreamUrl } from './xtream-client'
import {
  mapAccountInfo, mapCategories, mapLiveStreams, mapVodStreams, mapSeries, mapShortEpg, mapVodInfo,
} from './xtream-mappers'

/** Crée un Provider Xtream Codes à partir des identifiants fournis. */
export function createXtreamProvider(creds: XtreamCreds): Provider {
  return {
    async authenticate() {
      const raw = await fetchAuth<any>(creds)
      const info = mapAccountInfo(raw)
      if (Number(raw?.user_info?.auth) !== 1 || info.status.toLowerCase() !== 'active') throw new Error('Identifiants invalides ou abonnement inactif')
      return info
    },
    async getLiveCategories() {
      return mapCategories(await fetchAction<any[]>(creds, 'get_live_categories'), 'live')
    },
    async getLiveStreams(categoryId) {
      const params: Record<string, string> = categoryId ? { category_id: categoryId } : {}
      return mapLiveStreams(await fetchAction<any[]>(creds, 'get_live_streams', params))
    },
    async getVodCategories() {
      return mapCategories(await fetchAction<any[]>(creds, 'get_vod_categories'), 'movie')
    },
    async getVodStreams(categoryId) {
      const params: Record<string, string> = categoryId ? { category_id: categoryId } : {}
      return mapVodStreams(await fetchAction<any[]>(creds, 'get_vod_streams', params))
    },
    async getVodInfo(id) {
      return mapVodInfo(await fetchAction<any>(creds, 'get_vod_info', { vod_id: id }))
    },
    async getSeriesCategories() {
      return mapCategories(await fetchAction<any[]>(creds, 'get_series_categories'), 'series')
    },
    async getSeries(categoryId) {
      const params: Record<string, string> = categoryId ? { category_id: categoryId } : {}
      return mapSeries(await fetchAction<any[]>(creds, 'get_series', params))
    },
    async getSeasons(seriesId): Promise<Season[]> {
      const info = await fetchAction<any>(creds, 'get_series_info', { series_id: seriesId })
      const episodes = info?.episodes ?? {}
      return Object.keys(episodes)
        .map(Number)
        // Ignore les clés de saison non numériques (ex. "Specials" sur certains panels)
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
        .map((seasonNumber) => ({
          seasonNumber,
          episodes: (episodes[seasonNumber] ?? []).map((e: any) => ({
            id: String(e.id),
            title: String(e.title ?? ''),
            seasonNumber,
            episodeNumber: Number(e.episode_num ?? 0),
            containerExtension: e.container_extension || undefined,
          })),
        }))
    },
    async getShortEpg(channelId) {
      return mapShortEpg(await fetchAction<any>(creds, 'get_short_epg', { stream_id: channelId }))
    },
    buildStreamUrl(kind: StreamKind, id: string, ext?: string) {
      return buildStreamUrl(creds, kind, id, ext)
    },
  }
}
