import type { Provider } from './provider'
import type { Profile, Category, Channel, EpgEntry } from './models'

export interface LiveSession {
  provider(): Provider | null
  categories(): Promise<Category[]>
  /** Chaînes d'une catégorie ; `categoryId` vide ('') = toutes les chaînes. */
  channels(categoryId: string): Promise<Channel[]>
  nowNext(channelId: string): Promise<EpgEntry[]>
}


import { profileSession } from './profile-session'

export function createLiveSession(getActiveProfile: () => Profile | null, makeProvider: (p: Profile) => Provider): LiveSession {
  const current = profileSession(getActiveProfile, makeProvider)
  return {
    provider: () => current()?.provider ?? null,
    categories(): Promise<Category[]> {
      const c = current()
      return c ? c.cache.get('categories', () => c.provider.getLiveCategories()) : Promise.resolve([])
    },
    channels(categoryId: string): Promise<Channel[]> {
      const c = current()
      return c ? c.cache.get('channels:' + categoryId, () => c.provider.getLiveStreams(categoryId || undefined)) : Promise.resolve([])
    },
    nowNext(channelId: string): Promise<EpgEntry[]> {
      const c = current()
      return c ? c.cache.get('nowNext:' + channelId, () => c.provider.getShortEpg(channelId) .catch(() => [] as EpgEntry[]), 60_000, false) : Promise.resolve([])
    },
  }
}
