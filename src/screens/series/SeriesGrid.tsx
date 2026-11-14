import { route } from '../../router/router'
import { seriesSession } from '../../data/series-session-instance'
import { MediaGrid } from '../media/MediaGrid'
import { openSeries } from './series-nav'
import type { PosterItem } from '../media/PosterTile'
import { t } from '../../i18n'

/** Grille Séries — wrapper mince autour de MediaGrid générique. */
export function SeriesGrid() {
  // Lecture du catId depuis les segments de route : ['series', 'g', catId]
  const rawCatId = route.value.segments[2] ?? ''
  const catId = decodeURIComponent(rawCatId)

  function handleOpen(item: PosterItem) {
    // PosterItem est structurellement compatible avec Series (id/name/poster).
    openSeries({ id: item.id, name: item.name, poster: item.poster })
  }

  return (
    <MediaGrid
      catId={catId}
      load={(id) => seriesSession.list(id)}
      categories={seriesSession.categories}
      fallbackTitle={t('common.series')}
      navRailKey="nav-/series"
      onOpen={handleOpen}
    />
  )
}
