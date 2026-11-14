import type { AccountInfo, Category, Channel, Movie, MovieInfo, Series, EpgEntry, StreamKind } from '../models'

/** Convertit une valeur quelconque en nombre fini (0 si invalide). */
function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Décode une chaîne base64, renvoie la valeur d'origine en cas d'échec. */
function decode(b64: string): string {
  try {
    return atob(b64)
  } catch {
    return b64
  }
}

/** Mappe le JSON brut de player_api.php (auth) vers AccountInfo. */
export function mapAccountInfo(raw: any): AccountInfo {
  const u = raw?.user_info ?? {}
  return {
    status: String(u.status ?? ''),
    expDate: u.exp_date == null ? null : num(u.exp_date),
    maxConnections: num(u.max_connections),
    activeConnections: num(u.active_cons),
    allowedFormats: Array.isArray(u.allowed_output_formats)
      ? u.allowed_output_formats.map(String)
      : [],
  }
}

/** Mappe un tableau de catégories brutes vers Category[]. */
export function mapCategories(raw: any[], kind: StreamKind): Category[] {
  return (raw ?? []).map((c) => ({
    id: String(c.category_id),
    name: String(c.category_name ?? ''),
    kind,
  }))
}

/** Mappe un tableau de flux live bruts vers Channel[]. */
export function mapLiveStreams(raw: any[]): Channel[] {
  return (raw ?? []).map((s) => ({
    id: String(s.stream_id),
    name: String(s.name ?? ''),
    logo: s.stream_icon || undefined,
    epgChannelId: s.epg_channel_id || undefined,
    categoryId: s.category_id != null ? String(s.category_id) : undefined,
    number: s.num != null ? num(s.num) : undefined,
  }))
}

/** Mappe un tableau de flux VOD bruts vers Movie[]. */
export function mapVodStreams(raw: any[]): Movie[] {
  return (raw ?? []).map((m) => ({
    id: String(m.stream_id),
    name: String(m.name ?? ''),
    poster: m.stream_icon || undefined,
    categoryId: m.category_id != null ? String(m.category_id) : undefined,
    rating: m.rating != null ? num(m.rating) : undefined,
    added: m.added != null ? num(m.added) : undefined,
    containerExtension: m.container_extension || undefined,
  }))
}

/** Mappe un tableau de séries brutes vers Series[]. */
export function mapSeries(raw: any[]): Series[] {
  return (raw ?? []).map((s) => ({
    id: String(s.series_id),
    name: String(s.name ?? ''),
    poster: s.cover || undefined,
    categoryId: s.category_id != null ? String(s.category_id) : undefined,
    plot: s.plot || undefined,
    rating: s.rating != null ? num(s.rating) : undefined,
  }))
}

/** Extrait une année à 4 chiffres depuis une chaîne de date quelconque. */
function year(v: unknown): number | undefined {
  const s = String(v ?? '')
  const m = s.match(/(\d{4})/)
  return m ? Number(m[1]) : undefined
}

/** Mappe la réponse brute de get_vod_info vers MovieInfo. */
export function mapVodInfo(raw: any): MovieInfo {
  const i = raw?.info ?? {}
  const m = raw?.movie_data ?? {}
  const backdrop = Array.isArray(i.backdrop_path) ? i.backdrop_path[0] : i.backdrop_path
  const info: MovieInfo = { id: String(m.stream_id ?? '') }
  if (i.plot) info.plot = String(i.plot)
  if (i.duration_secs != null && Number(i.duration_secs)) info.durationSecs = Number(i.duration_secs)
  const y = year(i.releasedate || i.releaseDate)
  if (y) info.year = y
  if (i.rating != null && Number(i.rating)) info.rating = Number(i.rating)
  if (i.genre) info.genre = String(i.genre)
  if (i.cast) info.cast = String(i.cast)
  if (i.director) info.director = String(i.director)
  if (backdrop) info.backdrop = String(backdrop)
  if (m.container_extension) info.containerExtension = String(m.container_extension)
  return info
}

/** Mappe le JSON brut de get_short_epg vers EpgEntry[] (titres encodés en base64). */
export function mapShortEpg(raw: any): EpgEntry[] {
  const listings = raw?.epg_listings ?? []
  return listings.map((e: any) => ({
    title: decode(String(e.title ?? '')),
    description: e.description ? decode(String(e.description)) : undefined,
    start: num(e.start_timestamp),
    end: num(e.stop_timestamp),
  }))
}
