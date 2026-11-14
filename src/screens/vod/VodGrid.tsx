import { route } from '../../router/router'
import { vodSession } from '../../data/vod-session-instance'
import { MediaGrid } from '../media/MediaGrid'
import { openMovie } from './vod-nav'
import type { PosterItem } from '../media/PosterTile'
import { t } from '../../i18n'

/** Grille Films — wrapper mince autour de MediaGrid générique. */
export function VodGrid() {
  // Lecture du catId depuis les segments de route : ['films', 'g', catId]
  const rawCatId = route.value.segments[2] ?? ''
  const catId = decodeURIComponent(rawCatId)

  function handleOpen(item: PosterItem) {
    openMovie({ id: item.id, name: item.name, poster: item.poster })
  }

  return (
    <MediaGrid
      catId={catId}
      load={(id) => vodSession.streams(id)}
      categories={vodSession.categories}
      fallbackTitle={t('common.movies')}
      navRailKey="nav-/films"
      onOpen={handleOpen}
    />
  )
}
