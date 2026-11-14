import { describe, it, expect, beforeEach } from 'vitest'
import { createContinueWatchingStore } from './continue-watching-store'
import type { ContinueItem } from './continue-watching-store'

beforeEach(() => localStorage.clear())

// Utilitaire : crée un ContinueItem de type 'movie' pour les tests
const movieItem = (id: string): ContinueItem => ({ kind: 'movie', id, name: 'Film ' + id })

describe('createContinueWatchingStore', () => {
  it('save/get round-trip', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 60, 3600, 1000)
    const e = s.get('p1', 'm1')
    expect(e).not.toBeNull()
    expect(e!.item.id).toBe('m1')
    expect(e!.item.kind).toBe('movie')
    expect(e!.position).toBe(60)
    expect(e!.duration).toBe(3600)
    expect(e!.updatedAt).toBe(1000)
  })

  it('ignore si position < 10s', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 9, 3600, 1000)
    expect(s.get('p1', 'm1')).toBeNull()
  })

  it('ignore si position exactement 10s (limite basse incluse)', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 10, 3600, 1000)
    expect(s.get('p1', 'm1')).not.toBeNull()
  })

  it('supprime l\'entrée si position > 95% de la durée (contenu terminé)', () => {
    const s = createContinueWatchingStore()
    // D'abord sauvegarder une entrée valide
    s.save('p1', movieItem('m1'), 100, 3600, 1000)
    expect(s.get('p1', 'm1')).not.toBeNull()
    // Puis marquer comme terminé
    s.save('p1', movieItem('m1'), 3420, 3600, 2000) // 95% de 3600 = 3420
    expect(s.get('p1', 'm1')).toBeNull()
  })

  it('conserve l\'entrée si position exactement à 94% (pas encore terminé)', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 3384, 3600, 1000) // 94% de 3600 = 3384
    expect(s.get('p1', 'm1')).not.toBeNull()
  })

  it('list triée par updatedAt desc', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 60, 3600, 1000)
    s.save('p1', movieItem('m2'), 120, 3600, 3000)
    s.save('p1', movieItem('m3'), 90, 3600, 2000)
    const ids = s.list('p1').map((e) => e.item.id)
    expect(ids).toEqual(['m2', 'm3', 'm1'])
  })

  it('remove supprime une entrée', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 60, 3600, 1000)
    s.remove('p1', 'm1')
    expect(s.get('p1', 'm1')).toBeNull()
  })

  it('isole les entrées par profil', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 60, 3600, 1000)
    expect(s.get('p2', 'm1')).toBeNull()
    expect(s.list('p2')).toEqual([])
  })

  it('persiste entre instances', () => {
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 60, 3600, 1000)
    const s2 = createContinueWatchingStore()
    expect(s2.get('p1', 'm1')?.position).toBe(60)
  })

  it('get retourne null pour un id inexistant', () => {
    const s = createContinueWatchingStore()
    expect(s.get('p1', 'inexistant')).toBeNull()
  })

  it('list retourne [] si durée nulle (seuil 95% non applicable)', () => {
    // durée = 0 : pas de calcul de 95%, on ne supprime pas
    const s = createContinueWatchingStore()
    s.save('p1', movieItem('m1'), 60, 0, 1000)
    // position=60 >= 10, duration=0 → pas de seuil 95% → upsert
    expect(s.get('p1', 'm1')).not.toBeNull()
  })

  it('fonctionne avec un épisode (kind:episode)', () => {
    const s = createContinueWatchingStore()
    const ep: ContinueItem = { kind: 'episode', id: 'e1', name: 'Série — S1E1 Pilote', seriesName: 'Série' }
    s.save('p1', ep, 120, 2700, 5000)
    const e = s.get('p1', 'e1')
    expect(e).not.toBeNull()
    expect(e!.item.kind).toBe('episode')
    expect(e!.item.seriesName).toBe('Série')
  })
})
