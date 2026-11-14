/** Hôte proxifié en dev — doit matcher la cible du proxy dans vite.config.ts. */
export const DEV_PROXY_HOST = 'http://your-xtream-host:8080'

/**
 * Origine normalisée d'un hôte : `scheme://domaine:port`, en supprimant tout
 * chemin parasite (ex. « /ggggg ») et en ajoutant `http://` si le schéma manque.
 * L'API Xtream (`player_api.php`) et les flux sont toujours servis à la racine.
 */
export function normalizeHost(host: string): string {
  const withScheme = /^https?:\/\//i.test(host) ? host : `http://${host}`
  try {
    return new URL(withScheme).origin
  } catch {
    return withScheme.replace(/\/+$/, '')
  }
}

/**
 * Base d'URL effective pour un hôte donné.
 * En dev, l'hôte d'exemple passe par le proxy Vite (contourne le CORS local).
 * En prod (app webOS) ou pour tout autre hôte : appel direct (origine normalisée).
 * `isDev` est injectable pour la testabilité (défaut : import.meta.env.DEV).
 */
export function apiBase(host: string, isDev: boolean = import.meta.env.DEV): string {
  const origin = normalizeHost(host)
  if (isDev && origin === DEV_PROXY_HOST) return '/dev-xtream'
  return origin
}

/**
 * Préfixe une URL absolue par le proxy CORS local SI le build a été fait avec VITE_PROXY
 * (uniquement pour tester hors TV : navigateur/simulateur, où le CORS s'applique).
 * Sur le build TV (sans VITE_PROXY) : renvoie l'URL inchangée → appels directs.
 */
export function proxify(url: string): string {
  const base = import.meta.env.VITE_PROXY as string | undefined
  return base && /^https?:\/\//.test(url) ? base + url : url
}

/** Bound provider requests so failures lead to retry UI rather than an endless spinner. */
export async function fetchWithTimeout<T>(url: string, read: (response: Response) => Promise<T>, ms = 20000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try { return await read(await fetch(url, { signal: controller.signal })) }
  finally { clearTimeout(timer) }
}
