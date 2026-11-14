import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../../navigation/spatial'
import { selectedSeries } from './series-nav'
import type { Series } from '../../data/models'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// seriesSession.seasons → résout avec 1 saison contenant 1 épisode.
vi.mock('../../data/series-session-instance', () => ({
  seriesSession: {
    seasons: () =>
      Promise.resolve([
        {
          seasonNumber: 1,
          episodes: [
            {
              id: 'ep-1',
              title: 'Le Réveil de la Force',
              seasonNumber: 1,
              episodeNumber: 1,
              containerExtension: 'mkv',
            },
          ],
        },
      ]),
  },
}))

// continueWatchingStore.get → aucune reprise par défaut.
vi.mock('../../profiles/continue-watching', () => ({
  continueWatchingStore: {
    get: () => null,
  },
}))

// favoritesStore : pas favori, toggle no-op.
vi.mock('../../profiles/favorites', () => ({
  favoritesStore: {
    all: { value: {} },
    isFavorite: () => false,
    toggle: vi.fn(),
  },
}))

// profileStore : profil VOD fictif.
vi.mock('../../profiles/store', () => ({
  profileStore: {
    vodProfileId: { value: 'p1' },
  },
}))

// playEpisode et playItem → stubs sans effet de bord (pas de navigation réelle).
vi.mock('../player/playback', () => ({
  playEpisode: vi.fn(),
}))

// navigate → stub pour éviter toute navigation réelle pendant les tests.
vi.mock('../../router/router', () => ({
  navigate: vi.fn(),
}))

// ── Données de test ───────────────────────────────────────────────────────────

const SERIES: Series = {
  id: 'series-1',
  name: 'Cosmos : Une Odyssée',
  poster: undefined,
  plot: "Un voyage au travers de l'univers connu.",
}

// Import différé après les mocks (les mocks doivent être déclarés avant l'import du composant).
async function renderSeriesDetail() {
  const { SeriesDetail } = await import('./SeriesDetail')
  return render(<SeriesDetail />)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeAll(() => initSpatialNavigation())

beforeEach(() => {
  selectedSeries.value = SERIES
})

describe('SeriesDetail', () => {
  it('affiche le nom de la série', async () => {
    await renderSeriesDetail()
    expect(screen.getByText('Cosmos : Une Odyssée')).toBeTruthy()
  })

  it("affiche le titre de l'épisode chargé", async () => {
    await renderSeriesDetail()
    // Attendre la résolution de la promesse seasons (micro-tâche).
    await Promise.resolve()
    expect(screen.getByText('Le Réveil de la Force')).toBeTruthy()
  })

  it('affiche le bouton favori', async () => {
    await renderSeriesDetail()
    expect(screen.getByText('☆ Ajouter aux favoris')).toBeTruthy()
  })
})
