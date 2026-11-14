import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { initSpatialNavigation } from '../navigation/spatial'
import { profileStore } from '../profiles/store'
import { settingsStore } from '../profiles/settings'
import { ProfileForm } from './ProfileForm'

vi.mock('../data/provider-factory', () => ({ providerForProfile: () => ({ authenticate: async () => {} }) }))

beforeAll(() => initSpatialNavigation())
beforeEach(() => {
  localStorage.clear()
  settingsStore.language.value = 'fr'
  profileStore.replaceConfiguration({ profiles: [], liveId: null, vodId: null })
})

it('ajoute une liste gratuite iptv-org en un appui', async () => {
  const onDone = vi.fn()
  render(<ProfileForm onDone={onDone} />)
  fireEvent.click(screen.getByText('IPTV-ORG Global'))
  await waitFor(() => expect(onDone).toHaveBeenCalled())
  expect(profileStore.profiles.value).toMatchObject([
    { name: 'IPTV-ORG Global', kind: 'm3u', m3uUrl: 'https://iptv-org.github.io/iptv/index.m3u' },
  ])
})
