import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../../navigation/spatial'
import { ChannelList } from './ChannelList'
import type { Channel } from '../../data/models'

beforeAll(() => initSpatialNavigation())

const channels: Channel[] = [
  { id: '1', name: 'TF1' },
  { id: '2', name: 'France 2' },
]

describe('ChannelList', () => {
  it('affiche les chaînes', () => {
    render(<ChannelList channels={channels} onFocusChannel={() => {}} onPlay={() => {}} />)
    expect(screen.getByText('TF1')).toBeTruthy()
    expect(screen.getByText('France 2')).toBeTruthy()
  })
})

it('renders the saved channel even when it is outside the initial window', async () => {
  const { vi } = await import('vitest')
  Element.prototype.scrollIntoView = vi.fn()
  const many = Array.from({length:300}, (_,i) => ({id:String(i), name:`Channel ${i}`}))
  const onFocus = vi.fn()
  render(<ChannelList channels={many} restoreChannelId="250" onFocusChannel={onFocus} onPlay={() => {}} />)
  expect(screen.getByText('Channel 250')).toBeTruthy()
  await vi.waitFor(() => expect(onFocus).toHaveBeenCalledWith(many[250]))
})
