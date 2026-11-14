import { seriesSession } from '../../data/series-session-instance'
import { MediaHome } from '../media/MediaHome'
import { openSeries } from './series-nav'
export function SeriesHome() {
  return <MediaHome section="series" categories={seriesSession.categories} load={seriesSession.list} onOpen={openSeries} />
}
