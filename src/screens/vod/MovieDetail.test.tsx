import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../../navigation/spatial'
import { selectedMovie } from './vod-nav'
import type { Movie } from '../../data/models'

// ── Mocks ────────────────────────────────────────────────────────────────────

// vodSession.info → promesse toujours en attente (simule le fetch réseau).
vi.mock('../../data/vod-session-instance', () => ({
  vodSession: {
    info: () => new Promise(() => {}),
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

// profileStore : profil Films fictif.
vi.mock('../../profiles/store', () => ({
  profileStore: {
    vodProfileId: { value: 'p1' },
  },
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOVIE: Movie = {
  id: 'movie-1',
  name: 'Dune : Partie Deux',
  poster: undefined,
  rating: 8.5,
}

// Import différé après les mocks (les mocks doivent être déclarés avant l'import du composant).
async function renderMovieDetail() {
  const { MovieDetail } = await import('./MovieDetail')
  return render(<MovieDetail />)
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeAll(() => initSpatialNavigation())

beforeEach(() => {
  selectedMovie.value = MOVIE
})

describe('MovieDetail', () => {
  it('affiche le titre du film', async () => {
    await renderMovieDetail()
    expect(screen.getByText('Dune : Partie Deux')).toBeTruthy()
  })

  it('affiche le bouton « Lire » quand il n\'y a pas de reprise', async () => {
    await renderMovieDetail()
    expect(screen.getByText('▶ Lire')).toBeTruthy()
  })

  it('affiche le bouton « Favori » (non favori par défaut)', async () => {
    await renderMovieDetail()
    expect(screen.getByText('☆ Favori')).toBeTruthy()
  })
})
