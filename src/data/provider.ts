import type {
  AccountInfo, Category, Channel, Movie, MovieInfo, Series, Season, EpgEntry, StreamKind,
} from './models'

/**
 * Contrat commun masquant la source de données (Xtream API ou M3U).
 * Les méthodes catalogue sont définies dès M1 mais consommées par l'UI en M2+.
 */
export interface Provider {
  authenticate(): Promise<AccountInfo>
  getLiveCategories(): Promise<Category[]>
  getLiveStreams(categoryId?: string): Promise<Channel[]>
  getVodCategories(): Promise<Category[]>
  getVodStreams(categoryId?: string): Promise<Movie[]>
  getVodInfo(id: string): Promise<MovieInfo>
  getSeriesCategories(): Promise<Category[]>
  getSeries(categoryId?: string): Promise<Series[]>
  getSeasons(seriesId: string): Promise<Season[]>
  getShortEpg(channelId: string): Promise<EpgEntry[]>
  /** Construit l'URL de lecture (HLS .m3u8 par défaut pour le live). */
  buildStreamUrl(kind: StreamKind, id: string, ext?: string): string
}
