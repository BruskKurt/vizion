// Clés de focus partagées entre Films et Séries.
// Convention : préfixe neutre pour éviter les collisions avec live.

function focusId(id: string): string {
  return encodeURIComponent(id)
}

/** Clé de focus d'une tuile poster (film ou série). */
export function posterItemKey(id: string, scope?: string): string {
  return scope ? `mv-${focusId(scope)}-${focusId(id)}` : `mv-${focusId(id)}`
}

/** Clé de focus de la tuile « Voir + » d'une catégorie. */
export function seeMoreKey(catId: string): string {
  return `seemore-${focusId(catId)}`
}

/** Clé de focus du conteneur rangée d'un genre. */
export function genreRowKey(catId: string): string {
  return `genrerow-${focusId(catId)}`
}

/** Clé de focus du conteneur grille générique (MediaGrid).
 *  Vaut 'vod-grid' pour rester compatible avec la Sidebar existante. */
export const MEDIA_GRID = 'vod-grid'

/** Clé de focus de la rangée « Continuer à regarder ».
 *  Vaut 'vod-continue' pour rester compatible avec la Sidebar existante. */
export const CONTINUE_ROW = 'vod-continue'
