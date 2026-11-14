// Namespace commun pour toutes les clés localStorage de l'application
const NS = 'vizion:'

/** Lit une valeur depuis localStorage ; retourne `fallback` si absente ou JSON invalide. */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/**
 * Sérialise `value` en JSON et l'écrit dans localStorage.
 * Renvoie `false` si l'écriture échoue (ex. QuotaExceededError sur TV) plutôt que de
 * laisser remonter l'exception et faire planter l'appelant.
 */
export function save<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Supprime la clé namespacée du localStorage. */
export function remove(key: string): void {
  localStorage.removeItem(NS + key)
}
