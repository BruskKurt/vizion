import type { Channel } from '../../data/models'
import { liveSession } from '../../data/session-instance'

/**
 * URL de lecture d'une chaîne : URL directe (M3U) sinon construite via le provider (Xtream).
 * `ext` permet le repli HLS (.m3u8) → MPEG-TS (.ts) si le flux par défaut échoue.
 */
export function liveStreamUrl(channel: Channel, ext?: string): string {
  if (channel.url) return channel.url
  const provider = liveSession.provider()
  if (!provider) return ''
  return provider.buildStreamUrl('live', channel.id, ext)
}
