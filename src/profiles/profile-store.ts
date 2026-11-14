import { batch, signal, type Signal } from '@preact/signals'
import * as storage from './storage'
import type { Profile } from '../data/models'

// État persisté dans localStorage sous la clé "profiles".
// `liveId`/`vodId` : profils choisis respectivement pour le Direct et les Films
// (le fournisseur peut donner des comptes Xtream distincts Live vs VOD).
export interface PersistedState {
  profiles: Profile[]
  liveId: string | null
  vodId: string | null
  /** Ancien champ (mono-compte) — migré vers liveId/vodId. */
  activeId?: string | null
}

export interface ProfileStore {
  replaceConfiguration(state: PersistedState): void
  profiles: Signal<Profile[]>
  /** Profil utilisé pour le Direct (Live). */
  liveProfileId: Signal<string | null>
  /** Profil utilisé pour les Films (VOD). */
  vodProfileId: Signal<string | null>
  activeLiveProfile(): Profile | null
  activeVodProfile(): Profile | null
  addProfile(data: Omit<Profile, 'id' | 'createdAt'>): Profile
  updateProfile(id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>): void
  removeProfile(id: string): void
  setLiveProfile(id: string | null): void
  setVodProfile(id: string | null): void
}

const KEY = 'profiles'

function generateId(): string {
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createProfileStore(): ProfileStore {
  const initial = storage.load<PersistedState>(KEY, { profiles: [], liveId: null, vodId: null })
  const profiles = signal<Profile[]>(initial.profiles ?? [])
  // Migration : ancien `activeId` mono-compte → live + vod ; sinon 1er profil par défaut.
  const fallback = initial.profiles?.[0]?.id ?? null
  const liveProfileId = signal<string | null>(initial.liveId ?? initial.activeId ?? fallback)
  const vodProfileId = signal<string | null>(initial.vodId ?? initial.activeId ?? fallback)

  function commit(state: PersistedState) {
    if (!storage.save<PersistedState>(KEY, state)) throw new Error('Impossible de sauvegarder les playlists sur la TV.')
    batch(() => {
      profiles.value = state.profiles
      liveProfileId.value = state.liveId
      vodProfileId.value = state.vodId
    })
  }
  function state(): PersistedState {
    return { profiles: profiles.value, liveId: liveProfileId.value, vodId: vodProfileId.value }
  }

  return {
    replaceConfiguration: commit,
    profiles,
    liveProfileId,
    vodProfileId,
    activeLiveProfile() {
      return profiles.value.find((p) => p.id === liveProfileId.value) ?? null
    },
    activeVodProfile() {
      return profiles.value.find((p) => p.id === vodProfileId.value) ?? null
    },
    addProfile(data) {
      const profile: Profile = { ...data, id: generateId(), createdAt: Date.now() }
      const wasEmpty = profiles.value.length === 0
      commit({ profiles: [...profiles.value, profile], liveId: wasEmpty ? profile.id : liveProfileId.value, vodId: wasEmpty ? profile.id : vodProfileId.value })
      return profile
    },
    updateProfile(id, patch) {
      commit({ ...state(), profiles: profiles.value.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
    },
    removeProfile(id) {
      const remaining = profiles.value.filter((p) => p.id !== id)
      const fb = remaining[0]?.id ?? null
      commit({ profiles: remaining, liveId: liveProfileId.value === id ? fb : liveProfileId.value, vodId: vodProfileId.value === id ? fb : vodProfileId.value })
    },
    setLiveProfile(id) {
      commit({ ...state(), liveId: id })
    },
    setVodProfile(id) {
      commit({ ...state(), vodId: id })
    },
  }
}
