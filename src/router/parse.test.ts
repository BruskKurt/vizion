import { describe, it, expect } from 'vitest'
import { parseHash } from './parse'

describe('parseHash', () => {
  it('hash vide -> route racine', () => {
    expect(parseHash('')).toEqual({ path: '/', segments: [] })
    expect(parseHash('#')).toEqual({ path: '/', segments: [] })
    expect(parseHash('#/')).toEqual({ path: '/', segments: [] })
  })

  it('chemin simple', () => {
    expect(parseHash('#/films')).toEqual({ path: '/films', segments: ['films'] })
  })

  it('chemin avec paramètres', () => {
    expect(parseHash('#/series/42/saison/2')).toEqual({
      path: '/series/42/saison/2',
      segments: ['series', '42', 'saison', '2'],
    })
  })

  it('ignore les slashes superflus', () => {
    expect(parseHash('#//films//')).toEqual({ path: '/films', segments: ['films'] })
  })
})
