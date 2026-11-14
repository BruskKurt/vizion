import { describe, it, expect, vi } from 'vitest'
import { playerApiUrl, buildStreamUrl, fetchAuth } from './xtream-client'

const creds = { host: 'http://serv:8080', username: 'u', password: 'p' }

describe('playerApiUrl', () => {
  it('sans action : auth de base', () => {
    expect(playerApiUrl(creds, {})).toBe(
      'http://serv:8080/player_api.php?username=u&password=p',
    )
  })

  it('avec action + paramètres', () => {
    expect(playerApiUrl(creds, { action: 'get_live_streams', category_id: '5' })).toBe(
      'http://serv:8080/player_api.php?username=u&password=p&action=get_live_streams&category_id=5',
    )
  })
})

describe('buildStreamUrl', () => {
  it('live -> HLS .m3u8 par défaut', () => {
    expect(buildStreamUrl(creds, 'live', '123')).toBe('http://serv:8080/live/u/p/123.m3u8')
  })

  it('live avec extension explicite (.ts)', () => {
    expect(buildStreamUrl(creds, 'live', '123', 'ts')).toBe('http://serv:8080/live/u/p/123.ts')
  })

  it('movie -> .mp4 par défaut', () => {
    expect(buildStreamUrl(creds, 'movie', '77')).toBe('http://serv:8080/movie/u/p/77.mp4')
  })

  it('series -> segment "series"', () => {
    expect(buildStreamUrl(creds, 'series', '9', 'mkv')).toBe('http://serv:8080/series/u/p/9.mkv')
  })

  it('series -> .mp4 par défaut', () => {
    expect(buildStreamUrl(creds, 'series', '9')).toBe('http://serv:8080/series/u/p/9.mp4')
  })
})

describe('fetchAuth (gestion erreur HTTP)', () => {
  it('lève une erreur sur réponse non-OK', async () => {
    const stub = vi.fn(async () => new Response('nope', { status: 403 }))
    vi.stubGlobal('fetch', stub)
    await expect(fetchAuth(creds)).rejects.toThrow('Xtream HTTP 403')
    vi.unstubAllGlobals()
  })
})
