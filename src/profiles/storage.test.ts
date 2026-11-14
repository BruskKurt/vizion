import { describe, it, expect, beforeEach } from 'vitest'
import { load, save, remove } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('save puis load fait un aller-retour JSON', () => {
    save('k', { a: 1, b: ['x'] })
    expect(load('k', null)).toEqual({ a: 1, b: ['x'] })
  })

  it('load renvoie le fallback si la clé est absente', () => {
    expect(load('absent', { def: true })).toEqual({ def: true })
  })

  it('load renvoie le fallback si le JSON est corrompu', () => {
    localStorage.setItem('vizion:bad', '{not json')
    expect(load('bad', 'fallback')).toBe('fallback')
  })

  it('remove supprime la clé', () => {
    save('k', 1)
    remove('k')
    expect(load('k', 'gone')).toBe('gone')
  })

  it('les clés sont namespacées sous "vizion:"', () => {
    save('k', 1)
    expect(localStorage.getItem('vizion:k')).toBe('1')
  })
})
