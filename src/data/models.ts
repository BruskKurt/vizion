export type StreamKind = 'live' | 'movie' | 'series'

export interface Profile {
  id: string
  name: string
  kind: 'xtream' | 'm3u'
  // Xtream
  host?: string
  username?: string
  password?: string
  // M3U
  m3uUrl?: string
  createdAt: number
}

export interface AccountInfo {
  status: string
  expDate: number | null
  maxConnections: number
  activeConnections: number
  allowedFormats: string[]
}

export interface Category {
  id: string
  name: string
  kind: StreamKind
}

export interface Channel {
  id: string
  name: string
  logo?: string
  categoryId?: string
  epgChannelId?: string
  number?: number
  /** URL directe (flux M3U) ; absent pour Xtream (cf. buildStreamUrl) */
  url?: string
}

export interface Movie {
  id: string
  name: string
  poster?: string
  categoryId?: string
  rating?: number
  added?: number
  containerExtension?: string
}

export interface Series {
  id: string
  name: string
  poster?: string
  categoryId?: string
  plot?: string
  rating?: number
}

export interface Episode {
  id: string
  title: string
  seasonNumber: number
  episodeNumber: number
  containerExtension?: string
}

export interface Season {
  seasonNumber: number
  episodes: Episode[]
}

export interface EpgEntry {
  title: string
  description?: string
  /** secondes Unix */
  start: number
  /** secondes Unix */
  end: number
}

/** Métadonnées enrichies d'un film (renvoyées par get_vod_info). */
export interface MovieInfo {
  id: string
  plot?: string
  durationSecs?: number
  year?: number
  rating?: number
  genre?: string
  cast?: string
  director?: string
  backdrop?: string
  containerExtension?: string
}
