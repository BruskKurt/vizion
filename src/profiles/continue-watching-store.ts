import { signal, type Signal } from '@preact/signals'
import * as storage from './storage'

/** Élément générique pouvant être repris (film ou épisode de série). */
export interface ContinueItem {
  kind: 'movie' | 'episode'
  id: string
  name: string
  poster?: string
  containerExtension?: string
  /** Nom de la série parente (uniquement pour les épisodes). */
  seriesName?: string
}

export interface ContinueEntry {
  item: ContinueItem
  position: number
  duration: number
  updatedAt: number
}

// profileId -> itemId -> entry
type Map_ = Record<string, Record<string, ContinueEntry>>

export interface ContinueWatchingStore {
  all: Signal<Map_>
  /** Sauvegarde la position de lecture pour un film ou un épisode.
   *  Ignore si position < 10s.
   *  Supprime l'entrée si position > 95% de la durée (contenu considéré terminé).
   *  `now` est injecté pour la testabilité (ne pas utiliser Date.now() en interne). */
  save(profileId: string, item: ContinueItem, position: number, duration: number, now: number): void
  get(profileId: string, itemId: string): ContinueEntry | null
  /** Retourne les entrées du profil triées par updatedAt décroissant. */
  list(profileId: string): ContinueEntry[]
  remove(profileId: string, itemId: string): void
}

const KEY = 'continue'

export function createContinueWatchingStore(): ContinueWatchingStore {
  const all = signal<Map_>(storage.load<Map_>(KEY, {}))

  function persist() {
    storage.save(KEY, all.value)
  }

  return {
    all,
    save(profileId, item, position, duration, now) {
      // Ignorer si trop tôt dans la lecture (démarrage ou retrait accidentel)
      if (position < 10) return

      const profileMap = all.value[profileId] ?? {}

      // Supprimer si le contenu est considéré terminé (≥ 95% de la durée)
      if (duration > 0 && position >= 0.95 * duration) {
        if (profileMap[item.id]) {
          const { [item.id]: _removed, ...rest } = profileMap
          all.value = { ...all.value, [profileId]: rest }
          persist()
        }
        return
      }

      // Upsert de l'entrée
      all.value = {
        ...all.value,
        [profileId]: {
          ...profileMap,
          [item.id]: { item, position, duration, updatedAt: now },
        },
      }
      persist()
    },
    get(profileId, itemId) {
      return all.value[profileId]?.[itemId] ?? null
    },
    list(profileId) {
      const profileMap = all.value[profileId] ?? {}
      return Object.values(profileMap).sort((a, b) => b.updatedAt - a.updatedAt)
    },
    remove(profileId, itemId) {
      const profileMap = all.value[profileId] ?? {}
      if (!profileMap[itemId]) return
      const { [itemId]: _removed, ...rest } = profileMap
      all.value = { ...all.value, [profileId]: rest }
      persist()
    },
  }
}
