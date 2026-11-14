import { randomId } from './crypto'
import type { Profile } from '../data/models'
import type { PersistedState, ProfileStore } from '../profiles/profile-store'
import type { Provider } from '../data/provider'

export interface PlaylistDraft {
  id: string
  existingId?: string
  keep?: boolean
  name: string
  kind: 'xtream' | 'm3u'
  host?: string
  username?: string
  password?: string
  m3uUrl?: string
}
export interface Configuration { playlists: PlaylistDraft[]; liveId: string; vodId: string }
export interface ExistingPlaylist { id: string; name: string; kind: 'xtream' | 'm3u' }
export interface SetupMetadata { playlists: ExistingPlaylist[]; liveId: string | null; vodId: string | null }

function text(value: unknown, max: number): value is string { return typeof value === 'string' && value.length > 0 && value.length <= max }
function httpUrl(value: unknown): value is string {
  if (!text(value, 4096)) return false
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password }
  catch { return false }
}
export function validateConfiguration(value: unknown): asserts value is Configuration {
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 32000) throw new Error('Configuration too large')
  const c = value as Configuration
  if (!c || !Array.isArray(c.playlists) || c.playlists.length < 1 || c.playlists.length > 20) throw new Error('Invalid playlists')
  const ids = new Set<string>()
  const existing = new Set<string>()
  for (const p of c.playlists) {
    if (!p || !text(p.id, 100) || ids.has(p.id) || !text(p.name, 100) || !p.name.trim() || !['xtream', 'm3u'].includes(p.kind)) throw new Error('Invalid playlist')
    ids.add(p.id)
    if (p.existingId !== undefined) {
      if (!text(p.existingId, 100) || existing.has(p.existingId)) throw new Error('Invalid existing playlist')
      existing.add(p.existingId)
    }
    if (p.keep === true) { if (!p.existingId) throw new Error('Missing existing playlist'); continue }
    if (p.kind === 'm3u' ? !httpUrl(p.m3uUrl) : !httpUrl(p.host) || !text(p.username, 512) || !text(p.password, 512)) throw new Error('Invalid source')
  }
  if (!ids.has(c.liveId) || !ids.has(c.vodId)) throw new Error('Invalid selected source')
}

/** Validate all changed sources before a single durable write. Unchanged secrets stay on TV. */
export async function prepareConfiguration(value: unknown, original: Profile[], make: (p: Profile) => Provider): Promise<PersistedState> {
  validateConfiguration(value)
  const profiles: Profile[] = []
  const mapping = new Map<string, string>()
  for (const draft of value.playlists) {
    const previous = draft.existingId ? original.find(p => p.id === draft.existingId) : undefined
    if (draft.existingId && !previous) throw new Error('Source no longer exists')
    let profile: Profile
    if (draft.keep) profile = { ...previous! }
    else {
      profile = {
        id: previous?.id ?? `remote_${randomId()}`, createdAt: previous?.createdAt ?? Date.now(), name: draft.name.trim(), kind: draft.kind,
        ...(draft.kind === 'xtream' ? { host: draft.host, username: draft.username, password: draft.password } : { m3uUrl: draft.m3uUrl }),
      }
      await make(profile).authenticate()
    }
    profiles.push(profile)
    mapping.set(draft.id, profile.id)
  }
  return { profiles, liveId: mapping.get(value.liveId)!, vodId: mapping.get(value.vodId)! }
}
export function setupMetadata(store: ProfileStore): SetupMetadata {
  return { playlists: store.profiles.value.map(({ id, name, kind }) => ({ id, name, kind })), liveId: store.liveProfileId.value, vodId: store.vodProfileId.value }
}
