import type { Profile } from './models'
import type { Provider } from './provider'
import { DataCache } from './cache'

export function profileFingerprint(p: Profile | null): string {
  return p ? JSON.stringify([p.id, p.kind, p.host, p.username, p.password, p.m3uUrl]) : ''
}

export function profileSession(getProfile: () => Profile | null, make: (p: Profile) => Provider) {
  let current: { fingerprint: string; provider: Provider; cache: DataCache } | null = null
  return () => {
    const p = getProfile()
    if (!p) { current = null; return null }
    const fingerprint = profileFingerprint(p)
    if (current?.fingerprint !== fingerprint) current = { fingerprint, provider: make(p), cache: new DataCache() }
    return current
  }
}
