import { describe, it, expect } from 'vitest'
import { apiBase, normalizeHost, DEV_PROXY_HOST } from './http'

describe('normalizeHost', () => {
  it('supprime un chemin parasite (origine seule)', () => {
    expect(normalizeHost('http://h:8080/ggggg')).toBe('http://h:8080')
    expect(normalizeHost('http://h:8080/player_api.php')).toBe('http://h:8080')
  })
  it('ajoute http:// si le schéma manque', () => {
    expect(normalizeHost('h:8080')).toBe('http://h:8080')
  })
  it('préserve https et un port non standard', () => {
    expect(normalizeHost('https://h:8443')).toBe('https://h:8443')
  })
})

describe('apiBase', () => {
  it('normalise l\'hôte (chemin parasite supprimé)', () => {
    expect(apiBase('http://h:8080/ggggg', false)).toBe('http://h:8080')
  })

  it('en prod (isDev=false) : renvoie toujours l\'hôte direct', () => {
    expect(apiBase('http://h:8080', false)).toBe('http://h:8080')
    expect(apiBase(DEV_PROXY_HOST, false)).toBe(DEV_PROXY_HOST)
  })

  it('en dev : route via /dev-xtream UNIQUEMENT pour l\'hôte du proxy', () => {
    expect(apiBase(DEV_PROXY_HOST, true)).toBe('/dev-xtream')
    expect(apiBase('http://autre:8080', true)).toBe('http://autre:8080')
  })

  it('supprime les slashes finaux', () => {
    expect(apiBase('http://h:8080/', false)).toBe('http://h:8080')
    expect(apiBase('http://h:8080///', false)).toBe('http://h:8080')
  })
})
