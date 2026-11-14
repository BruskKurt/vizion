import { beforeEach, describe, expect, it, vi } from 'vitest'

const focus = vi.hoisted(() => ({ key: '' }))
vi.mock('@noriginmedia/norigin-spatial-navigation', () => ({ getCurrentFocusKey: () => focus.key }))

async function loadRouter() {
  vi.resetModules()
  return import('./router')
}

beforeEach(() => {
  focus.key = ''
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

  it("le rail repart d'une pile neuve : Back ne ressort pas dans une autre section", async () => {
    const router = await loadRouter()

    router.navigate('/films')
    router.navigate('/films/g/1')
    router.navigate('/films/m/9')
    router.resetNavigationStack('/series')

    expect(router.route.value.path).toBe('/series')
    expect(router.back()).toBe(false)
  })

  it('Back redonne le focus que la page avait en la quittant', async () => {
    const router = await loadRouter()

    router.navigate('/recherche')
    focus.key = 'sr-mv-9'
    router.navigate('/films/m/9')
    expect(router.rememberedFocus()).toBeUndefined()

    focus.key = 'movie-detail-play'
    router.navigate('/play')
    router.back()
    expect(router.rememberedFocus()).toBe('movie-detail-play')
    router.back()
    expect(router.route.value.path).toBe('/recherche')
    expect(router.rememberedFocus()).toBe('sr-mv-9')
  })
})
