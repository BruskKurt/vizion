import { describe, it, expect, beforeEach } from 'vitest'
import { createFavoritesStore } from './favorites-store'

beforeEach(() => localStorage.clear())

describe('createFavoritesStore', () => {
  it('toggle ajoute puis retire', () => {
    const s = createFavoritesStore()
    s.toggle('p1', 'c1')
    expect(s.isFavorite('p1', 'c1')).toBe(true)
    expect(s.list('p1')).toEqual(['c1'])
    s.toggle('p1', 'c1')
    expect(s.isFavorite('p1', 'c1')).toBe(false)
    expect(s.list('p1')).toEqual([])
  })

  it('isole les favoris par profil', () => {
    const s = createFavoritesStore()
    s.toggle('p1', 'c1')
    expect(s.isFavorite('p2', 'c1')).toBe(false)
  })

  it('persiste entre instances', () => {
    const s = createFavoritesStore()
    s.toggle('p1', 'c1')
    expect(createFavoritesStore().isFavorite('p1', 'c1')).toBe(true)
  })
})
