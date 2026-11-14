import { route } from '../../router/router'
import { VodHome } from './VodHome'
import { VodGrid } from './VodGrid'
import { MovieDetail } from './MovieDetail'

/** Aiguillage de la section Films selon les segments de route :
 *  /films       → VodHome (accueil)
 *  /films/g/…   → VodGrid (grille d'une catégorie)
 *  /films/m/…   → MovieDetail (fiche détail)
 */
export function FilmsScreen() {
  const seg = route.value.segments
  if (seg[1] === 'g') return <VodGrid />
  if (seg[1] === 'm') return <MovieDetail />
  return <VodHome />
}
