import { describe, it, expect } from 'vitest'
import { currentEntry, nextEntry, progressPct } from './epg'
import type { EpgEntry } from '../data/models'

const E = (start: number, end: number, title = 't'): EpgEntry => ({ title, start, end })
const entries = [E(100, 200, 'A'), E(200, 300, 'B'), E(300, 400, 'C')]

describe('currentEntry', () => {
  it('renvoie le programme en cours', () => {
    expect(currentEntry(entries, 250)?.title).toBe('B')
  })
  it('renvoie null hors plage', () => {
    expect(currentEntry(entries, 50)).toBeNull()
    expect(currentEntry(entries, 400)).toBeNull()
  })
})

describe('nextEntry', () => {
  it('renvoie le prochain programme', () => {
    expect(nextEntry(entries, 250)?.title).toBe('C')
  })
  it('renvoie null si aucun à venir', () => {
    expect(nextEntry(entries, 350)).toBeNull()
  })
})

describe('progressPct', () => {
  it('calcule le pourcentage et borne 0..100', () => {
    expect(progressPct(E(100, 200), 150)).toBe(50)
    expect(progressPct(E(100, 200), 50)).toBe(0)
    expect(progressPct(E(100, 200), 999)).toBe(100)
  })
  it('renvoie 0 si durée invalide', () => {
    expect(progressPct(E(100, 100), 100)).toBe(0)
  })
})
