import { describe, it, expect } from 'vitest'
import { browseTargetFromPlaybackState } from './LiveScreen'
import type { NowPlaying } from './now-playing'
import type { PlaybackTarget } from './playback'

describe('browseTargetFromPlaybackState', () => {
  it('préfère la chaîne réellement en cours au dernier lancement mémorisé', () => {
    const playing: NowPlaying = {
      categoryId: 'sport',
      channel: { id: 'bein-2', name: 'BeIN 2' },
    }
    const stale: PlaybackTarget = { categoryId: 'news', channelId: 'tf1' }

    expect(browseTargetFromPlaybackState(playing, stale)).toEqual({
      categoryId: 'sport',
      channelId: 'bein-2',
    })
  })

  it('retombe sur la cible mémorisée si aucune chaîne ne joue', () => {
    const fallback: PlaybackTarget = { categoryId: 'news', channelId: 'tf1' }

    expect(browseTargetFromPlaybackState(null, fallback)).toBe(fallback)
  })
})
