import { describe, it, expect } from 'vitest'
import { filterByName } from './search'

// ── Tests de filterByName (TDD) ───────────────────────────────────────────────

describe('filterByName', () => {
  const items = [
    { id: '1', name: 'Télévision' },
    { id: '2', name: 'France 2' },
    { id: '3', name: 'TF1' },
    { id: '4', name: 'Éléphant blanc' },
    { id: '5', name: 'M6 Boutique' },
  ]

  it('retourne [] pour une requête vide', () => {
    expect(filterByName(items, '', 10)).toEqual([])
  })

  it('retourne [] pour une requête composée uniquement d\'espaces', () => {
    expect(filterByName(items, '   ', 10)).toEqual([])
  })

  it('est insensible à la casse', () => {
    const result = filterByName(items, 'tf1', 10)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('TF1')
  })

  it('est insensible aux accents (query « tele » correspond à « Télévision »)', () => {
    const result = filterByName(items, 'tele', 10)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Télévision')
  })

  it('est insensible aux accents sur le nom (query « Elephant » correspond à « Éléphant blanc »)', () => {
    const result = filterByName(items, 'Elephant', 10)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Éléphant blanc')
  })

  it('effectue une correspondance de sous-chaîne', () => {
    const result = filterByName(items, 'rance', 10)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('France 2')
  })

  it('tronque les résultats à la limite donnée', () => {
    // « e » est contenu dans Télévision, France 2, Éléphant blanc, M6 Boutique → 4 résultats
    const result = filterByName(items, 'e', 2)
    expect(result).toHaveLength(2)
  })

  it('renvoie tous les résultats si la limite est supérieure au nombre de correspondances', () => {
    const result = filterByName(items, 'france', 100)
    expect(result).toHaveLength(1)
  })

  it('fonctionne avec des éléments génériques ayant d\'autres propriétés', () => {
    const richItems = [
      { id: 'a', name: 'Avatar', poster: 'url1' },
      { id: 'b', name: 'Avengers', poster: 'url2' },
      { id: 'c', name: 'Batman', poster: 'url3' },
    ]
    const result = filterByName(richItems, 'av', 10)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name)).toEqual(['Avatar', 'Avengers'])
  })
})

describe('progressive search', () => {
  it('publishes fast catalogues before a slow catalogue completes', async () => {
    const { vi } = await import('vitest')
    const { liveSession } = await import('../../data/session-instance')
    const { vodSession } = await import('../../data/vod-session-instance')
    const { seriesSession } = await import('../../data/series-session-instance')
    const { searchAll } = await import('./search')
    let finish!: (value: []) => void
    const slow = new Promise<[]>((resolve) => { finish = resolve })
    vi.spyOn(liveSession, 'channels').mockResolvedValue([{ id:'1', name:'France 2' }])
    vi.spyOn(vodSession, 'streams').mockReturnValue(slow)
    vi.spyOn(seriesSession, 'list').mockResolvedValue([])
    const update = vi.fn()
    try {
      const result = searchAll('France', 30, update)
      await vi.waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ channels: [{ id:'1', name:'France 2' }] })))
      finish([])
      expect((await result).channels).toHaveLength(1)
    } finally { finish([]); vi.restoreAllMocks() }
  })
})
