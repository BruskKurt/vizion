import { describe, it, expect } from 'vitest'
import {
  mapAccountInfo, mapCategories, mapLiveStreams, mapVodStreams, mapSeries, mapShortEpg, mapVodInfo,
} from './xtream-mappers'

describe('mapAccountInfo', () => {
  it('extrait les champs depuis user_info', () => {
    const raw = {
      user_info: {
        status: 'Active', exp_date: '1790000000', max_connections: '2',
        active_cons: '1', allowed_output_formats: ['m3u8', 'ts'],
      },
    }
    expect(mapAccountInfo(raw)).toEqual({
      status: 'Active', expDate: 1790000000, maxConnections: 2,
      activeConnections: 1, allowedFormats: ['m3u8', 'ts'],
    })
  })

  it('exp_date null reste null', () => {
    const raw = { user_info: { status: 'Active', exp_date: null, max_connections: '1', active_cons: '0', allowed_output_formats: [] } }
    expect(mapAccountInfo(raw).expDate).toBeNull()
  })
})

describe('mapCategories', () => {
  it('mappe id/nom + kind', () => {
    const raw = [{ category_id: '3', category_name: 'Sport', parent_id: 0 }]
    expect(mapCategories(raw, 'live')).toEqual([{ id: '3', name: 'Sport', kind: 'live' }])
  })
})

describe('mapLiveStreams', () => {
  it('mappe les chaînes', () => {
    const raw = [{ stream_id: 12, name: 'TF1', stream_icon: 'http://l/tf1.png', epg_channel_id: 'tf1.fr', category_id: '3', num: 1 }]
    expect(mapLiveStreams(raw)).toEqual([
      { id: '12', name: 'TF1', logo: 'http://l/tf1.png', epgChannelId: 'tf1.fr', categoryId: '3', number: 1 },
    ])
  })
})

describe('mapVodStreams', () => {
  it('mappe les films', () => {
    const raw = [{ stream_id: 77, name: 'Dune', stream_icon: 'http://p.jpg', category_id: '9', rating: '8.2', added: '1700000000', container_extension: 'mkv' }]
    expect(mapVodStreams(raw)).toEqual([
      { id: '77', name: 'Dune', poster: 'http://p.jpg', categoryId: '9', rating: 8.2, added: 1700000000, containerExtension: 'mkv' },
    ])
  })
})

describe('mapSeries', () => {
  it('mappe les séries', () => {
    const raw = [{ series_id: 5, name: 'The Bear', cover: 'http://c.jpg', category_id: '2', plot: 'Cuisine', rating: '9' }]
    expect(mapSeries(raw)).toEqual([
      { id: '5', name: 'The Bear', poster: 'http://c.jpg', categoryId: '2', plot: 'Cuisine', rating: 9 },
    ])
  })
})

describe('mapShortEpg', () => {
  it('décode les titres base64 et normalise les timestamps', () => {
    const raw = {
      epg_listings: [
        { title: btoa('JT 20h'), description: btoa('Info'), start_timestamp: '1700000000', stop_timestamp: '1700003600' },
      ],
    }
    expect(mapShortEpg(raw)).toEqual([
      { title: 'JT 20h', description: 'Info', start: 1700000000, end: 1700003600 },
    ])
  })
})

describe('mapVodInfo', () => {
  it('mappe info + movie_data', () => {
    const raw = {
      info: { plot: 'Désert', duration_secs: '9960', releasedate: '2024-03-01', rating: '8.2', genre: 'SF', cast: 'X', director: 'DV', backdrop_path: ['http://b.jpg'] },
      movie_data: { stream_id: 77, container_extension: 'mkv' },
    }
    expect(mapVodInfo(raw)).toEqual({
      id: '77', plot: 'Désert', durationSecs: 9960, year: 2024, rating: 8.2,
      genre: 'SF', cast: 'X', director: 'DV', backdrop: 'http://b.jpg', containerExtension: 'mkv',
    })
  })
  it('tolère des champs manquants', () => {
    expect(mapVodInfo({ info: {}, movie_data: { stream_id: 5 } })).toEqual({ id: '5' })
  })
})
