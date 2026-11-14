import { beforeEach, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import { prepareConfiguration, setupMetadata, validateConfiguration } from './configuration'
import { createProfileStore } from '../profiles/profile-store'
import { createReceiver, encryptConfiguration, decryptConfiguration } from './crypto'
import type { Provider } from '../data/provider'
import type { Profile } from '../data/models'
const old: Profile = { id: 'old', createdAt: 0, name: 'Old', kind: 'xtream', host: 'https://old.test', username: 'old', password: 'secret' }
const source = { id: 'new', name: 'New', kind: 'xtream', host: 'https://new.test', username: 'user', password: 'password' }
const config = { playlists: [source], liveId: 'new', vodId: 'new' }
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })
describe('remote configuration', () => {
  it('rejects invalid schemes, duplicate identities and missing source assignments', () => {
    expect(() => validateConfiguration({ ...config, playlists: [{ ...source, host: 'javascript:alert(1)' }] })).toThrow()
    expect(() => validateConfiguration({ ...config, playlists: [source, source] })).toThrow()
    expect(() => validateConfiguration({ ...config, liveId: 'missing' })).toThrow()
  })
  it('validates every changed source before saving anything', async () => {
    const store = createProfileStore()
    store.replaceConfiguration({ profiles: [old], liveId: old.id, vodId: old.id })
    const make = () => ({ authenticate: () => Promise.reject(new Error('invalid credentials')) }) as unknown as Provider
    await expect(prepareConfiguration(config, store.profiles.value, make)).rejects.toThrow()
    expect(store.profiles.value).toEqual([old])
    expect(createProfileStore().profiles.value).toEqual([old])
  })
  it('keeps secrets on TV when a source is unchanged', async () => {
    const store = createProfileStore()
    store.replaceConfiguration({ profiles: [old], liveId: old.id, vodId: old.id })
    expect(JSON.stringify(setupMetadata(store))).not.toContain('secret')
    const make = vi.fn()
    const next = await prepareConfiguration({ playlists: [{ id:'old', existingId:'old', keep:true, kind:'xtream', name:'Old' }], liveId:'old', vodId:'old' }, [old], make)
    expect(next.profiles).toEqual([old]); expect(make).not.toHaveBeenCalled()
  })
  it('preserves durable and in-memory state if storage fails', () => {
    const store = createProfileStore()
    store.replaceConfiguration({ profiles: [old], liveId: old.id, vodId: old.id })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => store.replaceConfiguration({ profiles: [], liveId: null, vodId: null })).toThrow()
    expect(store.profiles.value).toEqual([old])
    expect(createProfileStore().profiles.value).toEqual([old])
  })
  it('encrypts credentials for the TV and rejects tampering or another receiver', async () => {
    vi.stubGlobal('crypto', webcrypto)
    try {
      const tv = await createReceiver()
      const encrypted = await encryptConfiguration(tv.publicKey, config)
      expect(JSON.stringify(encrypted)).not.toContain('password')
      expect(await decryptConfiguration(tv.privateKey, encrypted)).toEqual(config)
      const other = await createReceiver()
      await expect(decryptConfiguration(other.privateKey, encrypted)).rejects.toThrow()
      await expect(decryptConfiguration(tv.privateKey, { ...encrypted, data: 'AAAA' })).rejects.toThrow()
    } finally { vi.unstubAllGlobals() }
  })
})
