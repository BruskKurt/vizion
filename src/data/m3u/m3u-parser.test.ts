import { describe, it, expect } from 'vitest'
import { parseM3u } from './m3u-parser'

const SAMPLE = `#EXTM3U
#EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1" tvg-logo="http://l/tf1.png" group-title="FR| TNT",TF1 HD
http://h:8080/live/u/p/101.ts
#EXTINF:-1 tvg-id="" tvg-logo="http://l/c.png" group-title="FR| CINE",Canal+
http://h:8080/live/u/p/102.ts
`

describe('parseM3u', () => {
  it('parse les entrées avec attributs, nom et URL', () => {
    const entries = parseM3u(SAMPLE)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      name: 'TF1 HD',
      url: 'http://h:8080/live/u/p/101.ts',
      attrs: { 'tvg-id': 'tf1.fr', 'tvg-name': 'TF1', 'tvg-logo': 'http://l/tf1.png', 'group-title': 'FR| TNT' },
    })
    expect(entries[1].name).toBe('Canal+')
    expect(entries[1].attrs['group-title']).toBe('FR| CINE')
  })

  it('ignore une playlist vide ou sans entrées', () => {
    expect(parseM3u('#EXTM3U\n')).toEqual([])
    expect(parseM3u('')).toEqual([])
  })

  it('ignore une ligne #EXTINF sans URL suivante', () => {
    expect(parseM3u('#EXTM3U\n#EXTINF:-1 group-title="X",Sans URL\n')).toEqual([])
  })

  it('ignore une URL nue sans #EXTINF précédent', () => {
    expect(parseM3u('#EXTM3U\nhttp://h/orpheline.ts\n')).toEqual([])
  })
})
