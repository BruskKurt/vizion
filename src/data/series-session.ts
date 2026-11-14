import type { Provider } from './provider'
import type { Profile, Category, Series, Season } from './models'

export interface SeriesSession {
  /** Provider du profil Séries courant (pour construire les URLs de lecture). */
  provider(): Provider | null
  /** Catégories de séries disponibles. */
  categories(): Promise<Category[]>
  /** Séries d'une catégorie ; `categoryId` vide ('') = toutes les séries. */
  list(categoryId: string): Promise<Series[]>
  /** Saisons (avec épisodes) d'une série. */
  seasons(seriesId: string): Promise<Season[]>
}


import { profileSession } from './profile-session'

export function createSeriesSession(getActiveProfile: () => Profile | null, makeProvider: (p: Profile) => Provider): SeriesSession {
  const current = profileSession(getActiveProfile, makeProvider)
  return {
    provider: () => current()?.provider ?? null,
    categories(): Promise<Category[]> {
      const c = current()
      return c ? c.cache.get('categories', () => c.provider.getSeriesCategories()) : Promise.resolve([])
    },
    list(categoryId: string): Promise<Series[]> {
      const c = current()
      return c ? c.cache.get('list:' + categoryId, () => c.provider.getSeries(categoryId || undefined)) : Promise.resolve([])
    },
    seasons(seriesId: string): Promise<Season[]> {
      const c = current()
      return c ? c.cache.get('seasons:' + seriesId, () => c.provider.getSeasons(seriesId)) : Promise.resolve([])
    },
  }
}
