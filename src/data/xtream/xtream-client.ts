import { apiBase, proxify, fetchWithTimeout } from '../http'
import type { StreamKind } from '../models'

/** Identifiants de connexion Xtream Codes. */
export interface XtreamCreds {
  host: string
  username: string
  password: string
}

/** Segment d'URL par type de flux. */
const SEGMENT: Record<StreamKind, string> = { live: 'live', movie: 'movie', series: 'series' }

/** Extension par défaut par type de flux. */
const DEFAULT_EXT: Record<StreamKind, string> = { live: 'm3u8', movie: 'mp4', series: 'mp4' }

/** Construit l'URL player_api.php avec les identifiants puis les paramètres optionnels. */
export function playerApiUrl(creds: XtreamCreds, params: Record<string, string>): string {
  const base = apiBase(creds.host)
  const q = new URLSearchParams({ username: creds.username, password: creds.password, ...params })
  return proxify(`${base}/player_api.php?${q.toString()}`)
}

/** Construit l'URL de lecture directe (HLS / MP4 / MKV…). */
export function buildStreamUrl(
  creds: XtreamCreds,
  kind: StreamKind,
  id: string,
  ext?: string,
): string {
  const base = apiBase(creds.host)
  const extension = ext ?? DEFAULT_EXT[kind]
  // Identifiants insérés bruts dans le chemin : c'est le format attendu par les serveurs
  // Xtream pour les URL de flux (contrairement à player_api.php qui les reçoit encodés).
  return proxify(`${base}/${SEGMENT[kind]}/${creds.username}/${creds.password}/${id}.${extension}`)
}

/** Exécute un fetch JSON générique et lève une erreur si la réponse n'est pas OK. */
async function getJson<T>(url: string): Promise<T> {
  return fetchWithTimeout(url, async res => {
    if (!res.ok) throw new Error(`Xtream HTTP ${res.status}`)
    return await res.json() as T
  })
}

/** Auth de base : renvoie le JSON brut { user_info, server_info }. */
export function fetchAuth<T>(creds: XtreamCreds): Promise<T> {
  return getJson<T>(playerApiUrl(creds, {}))
}

/** Appelle une action player_api.php et renvoie le JSON brut. */
export function fetchAction<T>(
  creds: XtreamCreds,
  action: string,
  params: Record<string, string> = {},
): Promise<T> {
  return getJson<T>(playerApiUrl(creds, { action, ...params }))
}
