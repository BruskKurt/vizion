import { it, vi, expect, beforeAll, afterEach } from 'vitest'
import { render, act, fireEvent, screen } from '@testing-library/preact'
import { options } from 'preact'
import { SpatialNavigation, getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { initSpatialNavigation } from '../../navigation/spatial'
import { categoryFocusKey, channelFocusKey } from './focus-keys'

const data = vi.hoisted(() => ({
  cats: Array.from({ length: 300 }, (_, i) => ({ id: `c${i}`, name: `Cat ${i}`, kind: 'live' as const })),
  chans: Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Channel ${i}`, number: i })),
}))
vi.mock('../../data/session-instance', () => ({
  liveSession: { categories: async () => data.cats, channels: async () => data.chans, nowNext: async () => [] },
}))

const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)))
const press = (key: 'ArrowDown' | 'ArrowUp') => act(() => { fireEvent.keyDown(window, { key, keyCode: key === 'ArrowDown' ? 40 : 38 }) })

const counts: Record<string, number> = {}
const prevDiffed = options.diffed
beforeAll(() => {
  initSpatialNavigation()
  Element.prototype.scrollIntoView = vi.fn()
  options.diffed = (v) => {
    const name = typeof v.type === 'function' ? v.type.name : ''
    if (name) counts[name] = (counts[name] ?? 0) + 1
    prevDiffed?.(v)
  }
})
afterEach(() => { options.diffed = prevDiffed })

async function renderLive() {
  const { LiveScreen } = await import('./LiveScreen')
  render(<LiveScreen />)
  await vi.waitFor(() => expect(SpatialNavigation.isParticipatingFocusableComponent(channelFocusKey('0'))).toBe(true))
}

it('touche maintenue dans les chaînes : focus par index, sans re-rendre catégories ni lignes', async () => {
  await renderLive()
  await act(() => { setFocus(channelFocusKey('0')) })
  await wait(20)
  for (const k in counts) delete counts[k]

  const STEPS = 20
  for (let i = 0; i < STEPS; i++) { await press('ArrowDown'); await wait(20) }

  expect(getCurrentFocusKey()).toBe(channelFocusKey(String(STEPS)))
  // Avant : ~600 rendus de catégories et ~80 lignes par appui.
  expect(counts.Item ?? 0).toBeLessThan(STEPS)
  expect(counts.Row ?? 0).toBeLessThan(5 * STEPS)
  // Le panneau d'aperçu suit une fois le défilement arrêté.
  await wait(200)
  expect(screen.getByRole('heading', { name: `Channel ${STEPS}` })).toBeTruthy()
})

it('haut/bas dans les catégories : focus par index', async () => {
  await renderLive()
  await act(() => { setFocus(categoryFocusKey('c0')) })
  await press('ArrowDown')
  expect(getCurrentFocusKey()).toBe(categoryFocusKey('c1'))
  await press('ArrowUp')
  await press('ArrowUp')
  expect(getCurrentFocusKey()).toBe(categoryFocusKey('__fav__'))
})
