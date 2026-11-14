import { beforeAll, expect, it, vi } from 'vitest'
import { render, waitFor, fireEvent, screen } from '@testing-library/preact'
import { MediaGrid } from './MediaGrid'
import { initSpatialNavigation } from '../../navigation/spatial'
import { profileStore } from '../../profiles/store'
import { savePosition } from '../../navigation/browse-memory'
beforeAll(() => { initSpatialNavigation(); Element.prototype.scrollIntoView = vi.fn() })
it('mounts a distant saved item before restoring focus, with a bounded DOM', async () => {
  profileStore.vodProfileId.value = 'grid-test'
  savePosition('grid-test:nav-/films:12', { id: '901', index: 900, scrollTop: 49950 })
  const items = Array.from({length:1000}, (_,i) => ({ id: String(i+1), name: `Film ${i+1}` }))
  const { container } = render(<MediaGrid catId="12" navRailKey="nav-/films" load={async () => items} categories={async () => []} onOpen={() => {}} />)
  await waitFor(() => expect(container.querySelector('[data-focus-key="mv-901"]')?.getAttribute('data-focused')).toBe('true'))
  expect(container.querySelectorAll('[data-focus-key^="mv-"]').length).toBeLessThanOrEqual(42)
})
it('offers a working retry after a catalogue failure', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{id:'retry-film',name:'Recovered'}])
  render(<MediaGrid catId="retry" load={load} categories={async () => []} onOpen={() => {}} />)
  fireEvent.click(await screen.findByRole('button', {name:'Réessayer'}))
  expect(await screen.findByRole('button', {name:'Recovered'})).toBeTruthy()
})
