import { signal } from '@preact/signals'
import type { Movie, Series, Episode } from '../../data/models'
import { navigate } from '../../router/router'
import { vodSession } from '../../data/vod-session-instance'

/** Cible de lecture générique : film ou épisode. */
export interface PlayItem {
  kind: 'movie' | 'episode'
  id: string
  name: string
  poster?: string
  containerExtension?: string
  /** Nom de la série (pour les épisodes) — conservé jusque dans la reprise. */
  seriesName?: string
  startPosition: number
}

/** Signal contenant l'élément en cours de lecture (null = aucun). */
export const playbackTarget = signal<PlayItem | null>(null)

/** Lance la lecture d'un élément et navigue vers /play. */
export function playItem(item: PlayItem): void {
  playbackTarget.value = item
  navigate('/play')
}

/** Lance la lecture d'un film (raccourci). */
export function playMovie(movie: Movie, startPosition = 0): void {
  playItem({
    kind: 'movie',
    id: movie.id,
    name: movie.name,
    poster: movie.poster,
    containerExtension: movie.containerExtension,
    startPosition,
  })
}

/** Lance la lecture d'un épisode (raccourci). */
export function playEpisode(ep: Episode, series: Series, startPosition = 0): void {
  playItem({
    kind: 'episode',
    id: ep.id,
    name: `${series.name} — S${ep.seasonNumber}E${ep.episodeNumber} ${ep.title}`,
    poster: series.poster,
    containerExtension: ep.containerExtension,
    seriesName: series.name,
    startPosition,
  })
}

/** Construit l'URL de flux pour un PlayItem (Xtream). Renvoie '' si impossible. */
export function mediaStreamUrl(item: PlayItem): string {
  const p = vodSession.provider()
  if (!p) return ''
  try {
    return p.buildStreamUrl(item.kind === 'episode' ? 'series' : 'movie', item.id, item.containerExtension)
  } catch {
    return ''
  }
}
