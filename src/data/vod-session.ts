import type { Provider } from './provider'
import type { Profile, Category, Movie, MovieInfo } from './models'

export interface VodSession {
  /** Provider du profil Films courant (pour construire les URLs de lecture). */
  provider(): Provider | null
  categories(): Promise<Category[]>
  /** Films d'une catégorie ; `categoryId` vide ('') = tous les films. */
  streams(categoryId: string): Promise<Movie[]>
  info(id: string): Promise<MovieInfo>
}


import { profileSession } from './profile-session'

export function createVodSession(getActiveProfile: () => Profile | null, makeProvider: (p: Profile) => Provider): VodSession {
  const current = profileSession(getActiveProfile, makeProvider)
  return {
    provider: () => current()?.provider ?? null,
    categories(): Promise<Category[]> {
      const c = current()
      return c ? c.cache.get('categories', () => c.provider.getVodCategories()) : Promise.resolve([])
    },
    streams(categoryId: string): Promise<Movie[]> {
      const c = current()
      return c ? c.cache.get('streams:' + categoryId, () => c.provider.getVodStreams(categoryId || undefined)) : Promise.resolve([])
    },
    info(id: string): Promise<MovieInfo> {
      const c = current()
      return c ? c.cache.get('info:' + id, () => c.provider.getVodInfo(id)) : Promise.resolve({ id })
    },
  }
}
