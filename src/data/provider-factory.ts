import type { Profile } from './models'
import type { Provider } from './provider'
import { createXtreamProvider } from './xtream/xtream-provider'
import { createM3uProvider } from './m3u/m3u-provider'

/**
 * Instancie le Provider correspondant au type de profil.
 * Note (M2) : chaque appel crée une nouvelle instance (le provider M3U met en cache
 * sa playlist en interne) → l'appelant devra conserver l'instance du profil actif
 * plutôt que d'appeler cette factory à chaque écran.
 */
export function providerForProfile(profile: Profile): Provider {
  if (profile.kind === 'xtream') {
    return createXtreamProvider({
      host: profile.host ?? '',
      username: profile.username ?? '',
      password: profile.password ?? '',
    })
  }
  return createM3uProvider(profile.m3uUrl ?? '')
}
