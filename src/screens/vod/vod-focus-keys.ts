// Clés de focus pour la section VOD (films).
// Suit la même convention que focus-keys.ts (live) : encodeURIComponent pour les ids.

function focusId(id: string): string {
  return encodeURIComponent(id)
}

/** Clé de focus d'une tuile film. */
export function movieFocusKey(id: string): string {
  return `mv-${focusId(id)}`
}

/** Clé de focus de la tuile « Voir + » d'une catégorie. */
export function seeMoreKey(catId: string): string {
  return `seemore-${focusId(catId)}`
}

/** Clé de focus du conteneur rangée « Continuer à regarder ». */
export const VOD_CONTINUE_ROW = 'vod-continue'

/** Clé de focus du conteneur rangée d'un genre. */
export function genreRowKey(catId: string): string {
  return `genrerow-${focusId(catId)}`
}

/** Clé de focus du conteneur de la grille VOD (VodGrid). */
export const VOD_GRID = 'vod-grid'

/** Clés de focus des actions de la fiche film. */
export const MOVIE_DETAIL_PLAY = 'movie-play'
export const MOVIE_DETAIL_RESTART = 'movie-restart'
export const MOVIE_DETAIL_FAVORITE = 'movie-favorite'
