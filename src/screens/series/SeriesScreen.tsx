import { route } from '../../router/router'
import { SeriesHome } from './SeriesHome'
import { SeriesGrid } from './SeriesGrid'
import { SeriesDetail } from './SeriesDetail'

/** Aiguillage de la section Séries selon les segments de route :
 *  /series       → SeriesHome (accueil)
 *  /series/g/…   → SeriesGrid (grille d'une catégorie)
 *  /series/s/…   → SeriesDetail (fiche détail)
 */
export function SeriesScreen() {
  const seg = route.value.segments
  if (seg[1] === 'g') return <SeriesGrid />
  if (seg[1] === 's') return <SeriesDetail />
  return <SeriesHome />
}
