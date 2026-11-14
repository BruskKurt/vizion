import { useCallback, useState, useEffect, useRef } from 'preact/hooks'
import { getCurrentFocusKey, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'
import { focusIfExists } from './navigation/focus'
import { HomeScreen } from './screens/HomeScreen'
import { rememberChannel } from './profiles/recent-channels'
import { RemoteSetup } from './remote-config/RemoteSetup'
import { profileFingerprint } from './data/profile-session'
import { Sidebar } from './components/Sidebar'
import { ExitConfirm } from './components/ExitConfirm'
import { Placeholder } from './screens/Placeholder'
import { LanguageOnboarding } from './screens/LanguageOnboarding'
import { ProfilesManager } from './screens/ProfilesManager'
import { LiveScreen } from './screens/live/LiveScreen'
import { LivePlayerLayer } from './screens/live/LivePlayerLayer'
import { FilmsScreen } from './screens/vod/FilmsScreen'
import { SeriesScreen } from './screens/series/SeriesScreen'
import { SearchScreen } from './screens/search/SearchScreen'
import { FavoritesScreen } from './screens/favorites/FavoritesScreen'
import { MediaPlayer } from './screens/player/MediaPlayer'
import { nowPlaying, setNowPlaying } from './screens/live/now-playing'
import { route, back, navigate } from './router/router'
import { useRemote } from './remote/useRemote'
import type { RemoteAction } from './remote/keys'
import { profileStore } from './profiles/store'
import { settingsStore } from './profiles/settings'
import { dispatchBackHandlers } from './navigation/back-handlers'
import { t, type TranslationKey } from './i18n'

const TITLE_KEYS: Record<string, TranslationKey> = {
  accueil: 'nav.home',
  direct: 'nav.direct',
  films: 'nav.films',
  series: 'nav.series',
  favoris: 'nav.favorites',
  recherche: 'nav.search',
  reglages: 'nav.settings',
}

export function App() {
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const hasActive = profileStore.profiles.value.length > 0
  const hasSelectedLanguage = settingsStore.languageSelected.value
  const section = route.value.segments[0] ?? 'direct'
  const isLivePlaying = section === 'direct' && route.value.segments[1] === 'play'
  // Lecture plein écran générique (film ou épisode) sous la route /play.
  const isMediaPlaying = section === 'play'
  const fullscreenPlaying = isLivePlaying || isMediaPlaying

  const onAction = useCallback((action: RemoteAction) => {
    if (action.type !== 'back') return
    if (exitConfirmOpen) {
      setExitConfirmOpen(false)
      return
    }
    // En lecture plein écran, chaque lecteur gère son propre Back (éviter la double nav).
    if (fullscreenPlaying) return
    if (dispatchBackHandlers()) return
    // back() dépile la pile de navigation (films/m → films/g → films, etc.).
    if (back()) return
    // Depuis une section autre que Direct (et sans historique à dépiler), ramène à Direct.
    if (section !== 'direct') { navigate('/direct', { replace: true }); return }
    setExitConfirmOpen(true)
  }, [exitConfirmOpen, fullscreenPlaying, section])
  useRemote(onAction)

  // Restauration du focus : après un changement de section, l'élément focalisé précédent
  // a pu se démonter (ex. carte de Réglages) → le D-pad serait « mort ». Si le focus
  // courant n'existe plus, on le redonne au rail de la section active.
  useEffect(() => {
    if (!hasActive || fullscreenPlaying) return
    const id = setTimeout(() => {
      const cur = getCurrentFocusKey()
      if (!cur || !doesFocusableExist(cur)) {
        focusIfExists(`nav-/${section}`) || focusIfExists('nav-/direct')
      }
    }, 0)
    return () => clearTimeout(id)
  }, [section, fullscreenPlaying, hasActive])

  const activeId = profileStore.liveProfileId.value
  const playingNow = nowPlaying.value

  // Mémorise la dernière chaîne regardée (pour la reprise au démarrage).
  useEffect(() => {
    if (activeId && playingNow) {
      settingsStore.setLastWatched(activeId, playingNow.channel, playingNow.categoryId)
      rememberChannel(activeId, playingNow.channel, playingNow.categoryId)
    }
  }, [activeId, playingNow])

  // Reprise au démarrage (une fois) : relance la dernière chaîne si l'option est active.
  const resumeDone = useRef(false)
  useEffect(() => {
    if (resumeDone.current || !activeId) return
    resumeDone.current = true
    if (section !== 'direct' || !settingsStore.resumeLastChannel.value || nowPlaying.value) return
    const lw = settingsStore.getLastWatched(activeId)
    if (lw) {
      setNowPlaying(lw.channel, lw.categoryId)
      navigate('/direct/play')
    }
  }, [activeId])

  function confirmExit() {
    setExitConfirmOpen(false)
    window.close()
  }

  const exitDialog = exitConfirmOpen ? (
    <ExitConfirm onCancel={() => setExitConfirmOpen(false)} onConfirm={confirmExit} />
  ) : null

  if (section === 'configure') return <RemoteSetup onClose={() => navigate(hasActive ? '/reglages' : '/direct', { replace: true })} />

  // Gate : au tout premier lancement, la langue est choisie avant le profil IPTV.
  if (!hasActive && !hasSelectedLanguage) {
    return (
      <>
        <LanguageOnboarding />
        {exitDialog}
      </>
    )
  }

  // Gate : sans profil actif, on force l'onboarding profil (sans rail latéral).
  if (!hasActive) {
    return (
      <>
        <ProfilesManager />
        {exitDialog}
      </>
    )
  }

  const title = t(TITLE_KEYS[section] ?? 'nav.direct')
  const playing = nowPlaying.value

  function content() {
    if (section === 'accueil') return <HomeScreen />
    if (section === 'direct') return <LiveScreen key={profileFingerprint(profileStore.activeLiveProfile())} />
    if (section === 'films') return <FilmsScreen key={profileFingerprint(profileStore.activeVodProfile())} />
    // Section Séries : aiguillée par SeriesScreen (home / grille / fiche).
    if (section === 'series') return <SeriesScreen key={profileFingerprint(profileStore.activeVodProfile())} />
    if (section === 'reglages') return <ProfilesManager embedded />
    // Section Recherche : clavier virtuel + résultats groupés.
    if (section === 'recherche') return <SearchScreen />
    if (section === 'favoris') return <FavoritesScreen />
    return <Placeholder title={title} />
  }

  return (
    <>
      {/* ── Lecteur média plein écran (films + épisodes) ─────────────────────
          Monté sous la route /play ; MediaPlayer gère son propre Back. */}
      {isMediaPlaying && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }}>
          <MediaPlayer />
        </div>
      )}

      {/* ── Lecteur Live persistant : plein écran ↔ PIP ──────────────────────
          Masqué pendant la lecture média pour éviter deux vidéos simultanées.
          Un seul conteneur (style change, pas de démontage) → continuité Live. */}
      {playing && !isMediaPlaying && (
        <div
          style={
            isLivePlaying
              ? { position: 'fixed', inset: 0, zIndex: 30 }
              : {
                  position: 'fixed', right: 40, bottom: 40, width: 560, height: 315, zIndex: 40,
                  borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 0 0 1px var(--hairline)', border: '2px solid rgba(255,255,255,0.18)',
                }
          }
        >
          <LivePlayerLayer fullscreen={isLivePlaying} />
        </div>
      )}

      {/* ── Shell de navigation (rail + contenu) ─────────────────────────────
          Masqué en lecture plein écran (live ou média). */}
      {!fullscreenPlaying && (
        <div className={section === 'reglages' ? 'settings-shell' : undefined} style={{ display: 'flex', height: '100%', position: 'relative', zIndex: 10, background: 'var(--bg)' }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>{content()}</main>
        </div>
      )}
      {exitDialog}
    </>
  )
}
