import { signal, type Signal } from '@preact/signals'
import * as storage from './storage'

type FavMap = Record<string, string[]>

export interface FavoritesStore {
  all: Signal<FavMap>
  isFavorite(profileId: string, channelId: string): boolean
  list(profileId: string): string[]
  toggle(profileId: string, channelId: string): void
}

const KEY = 'favorites'

export function createFavoritesStore(): FavoritesStore {
  const all = signal<FavMap>(storage.load<FavMap>(KEY, {}))

  function persist() {
    storage.save(KEY, all.value)
  }

  return {
    all,
    isFavorite(profileId, channelId) {
      return (all.value[profileId] ?? []).includes(channelId)
    },
    list(profileId) {
      // Copie : empêche toute mutation externe du tableau interne (qui contournerait
      // la notification du signal et la persistance).
      return [...(all.value[profileId] ?? [])]
    },
    toggle(profileId, channelId) {
      const cur = all.value[profileId] ?? []
      const next = cur.includes(channelId)
        ? cur.filter((id) => id !== channelId)
        : [...cur, channelId]
      all.value = { ...all.value, [profileId]: next }
      persist()
    },
  }
}
