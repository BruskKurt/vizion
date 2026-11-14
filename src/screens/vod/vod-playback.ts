/**
 * Ré-export de compatibilité ascendante : l'ancienne API vod-playback est désormais
 * fournie par le module générique player/playback. Les importeurs existants n'ont
 * pas besoin d'être modifiés immédiatement.
 */
export {
  playbackTarget,
  playItem,
  playMovie,
  mediaStreamUrl,
} from '../player/playback'

// Alias pour les importeurs qui utilisaient encore les anciens noms.
export { playbackTarget as vodPlaybackTarget } from '../player/playback'
export { mediaStreamUrl as movieStreamUrl } from '../player/playback'
