import { beforeEach, describe, expect, it, vi } from 'vitest'

async function loadRouter() {
  vi.resetModules()
  return import('./router')
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.location.hash = ''
})

describe('router', () => {
  it('met à jour la route synchronement à la navigation', async () => {
    const router = await loadRouter()

    router.navigate('/films')

    expect(router.route.value.path).toBe('/films')
    expect(router.route.value.segments).toEqual(['films'])
  })

  it('revient dans la pile applicative puis signale la racine', async () => {
    const router = await loadRouter()

    router.navigate('/films')
    router.navigate('/series')

    expect(router.back()).toBe(true)
    expect(router.route.value.path).toBe('/films')
    expect(router.back()).toBe(true)
    expect(router.route.value.path).toBe('/')
    expect(router.back()).toBe(false)
  })

  it('replace supprime une route modale de la pile', async () => {
    const router = await loadRouter()

    router.navigate('/direct')
    router.navigate('/direct/play')
    router.navigate('/direct', { replace: true })

    expect(router.route.value.path).toBe('/direct')
    expect(router.back()).toBe(true)
    expect(router.route.value.path).toBe('/')
  })
})
