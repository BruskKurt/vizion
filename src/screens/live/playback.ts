import { signal } from '@preact/signals'
import type { Channel } from '../../data/models'
import { navigate } from '../../router/router'
import { setNowPlaying } from './now-playing'

/** Catégorie virtuelle « Favoris » (partagée par LiveScreen et LivePlayer). */
export const FAV_ID = '__fav__'

export interface PlaybackTarget {
  categoryId: string
  channelId: string
}

/** Dernière chaîne lancée (sert à restaurer le focus au retour dans le browse). */
export const playbackTarget = signal<PlaybackTarget | null>(null)

export function rememberPlaybackTarget(channel: Channel, categoryId: string): void {
  playbackTarget.value = { categoryId, channelId: channel.id }
}

export function startPlayback(channel: Channel, categoryId: string): void {
  rememberPlaybackTarget(channel, categoryId)
  setNowPlaying(channel, categoryId)
  navigate('/direct/play')
}
