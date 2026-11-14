import { signal } from '@preact/signals'
import type { Channel } from '../../data/models'

/** Chaîne en cours de lecture (persiste à travers browse ↔ plein écran). */
export interface NowPlaying {
  channel: Channel
  categoryId: string
}

export const nowPlaying = signal<NowPlaying | null>(null)

export function setNowPlaying(channel: Channel, categoryId: string): void {
  nowPlaying.value = { channel, categoryId }
}

export function stopPlaying(): void {
  nowPlaying.value = null
}
