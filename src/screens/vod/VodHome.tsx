import { vodSession } from '../../data/vod-session-instance'
import { MediaHome } from '../media/MediaHome'
import { openMovie } from './vod-nav'
export function VodHome() {
  return <MediaHome section="films" categories={vodSession.categories} load={vodSession.streams} onOpen={openMovie} />
}
