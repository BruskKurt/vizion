import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks'
import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import type { Category, Channel, EpgEntry } from '../../data/models'
import { liveSession } from '../../data/session-instance'
import { favoritesStore } from '../../profiles/favorites'
import { profileStore } from '../../profiles/store'
import { settingsStore } from '../../profiles/settings'
import { focusIfExists } from '../../navigation/focus'
import { useBackHandler } from '../../navigation/back-handlers'
import { CategoryList } from './CategoryList'
import { ChannelList } from './ChannelList'
import { ChannelPreview } from './ChannelPreview'
import { nowPlaying, type NowPlaying } from './now-playing'
import { startPlayback, playbackTarget, FAV_ID, type PlaybackTarget } from './playback'
import { liveStreamUrl } from './stream-url'
import { categoryFocusKey, channelFocusKey, LIVE_CATEGORIES } from './focus-keys'
import { ActionButton } from '../../components/ActionButton'
import { t } from '../../i18n'

const PREVIEW_DELAY = 1000

function sortChannels(list: Channel[]): Channel[] {
  return [...list].sort((a, b) => {
    const na = a.number ?? Number.MAX_SAFE_INTEGER
    const nb = b.number ?? Number.MAX_SAFE_INTEGER
    return na - nb || a.name.localeCompare(b.name)
  })
}

export function browseTargetFromPlaybackState(playing: NowPlaying | null, fallback: PlaybackTarget | null): PlaybackTarget | null {
  if (playing) return { categoryId: playing.categoryId, channelId: playing.channel.id }
  return fallback
}

export function LiveScreen() {
  const profileId = profileStore.liveProfileId.value ?? ''
  // À l'ouverture, on restaure la catégorie/chaîne du dernier visionnage (retour Back).
  const restoreRef = useRef(browseTargetFromPlaybackState(nowPlaying.peek(), playbackTarget.peek()))
  const [playlistCategories, setPlaylistCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string>(restoreRef.current?.categoryId ?? FAV_ID)
  const [editingCategories, setEditingCategories] = useState(false)
  const [loaded, setLoaded] = useState<Channel[]>([])
  const [loadingChans, setLoadingChans] = useState(false)
  const [focused, setFocused] = useState<Channel | null>(null)
  const [epg, setEpg] = useState<EpgEntry[]>([])
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000))
  const [error, setError] = useState<string | null>(null)
  const initialFocusDone = useRef(false)
  const [attempt, retry] = useState(0)
  const hiddenLiveCategoryIds = profileId ? settingsStore.getHiddenLiveCategoryIds(profileId) : []
  const hiddenCategoryIdSet = new Set(hiddenLiveCategoryIds)
  const visiblePlaylistCategories = playlistCategories.filter((cat) => !hiddenCategoryIdSet.has(cat.id))
  const categories = [{ id: FAV_ID, name: t('live.favorites'), kind: 'live' as const }, ...visiblePlaylistCategories]
  // Back en mode édition des catégories : termine l'édition au lieu de quitter le Direct.
  useBackHandler(useCallback(() => { setEditingCategories(false); return true }, []), editingCategories)

  // Horloge : rafraîchit la progression EPG périodiquement.
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30000)
    return () => clearInterval(id)
  }, [])

  // Catégories : Favoris en tête + catégories live. On démarre sur la 1re vraie catégorie
  // (éviter de tout télécharger pour des favoris vides au lancement).
  useEffect(() => {
    let alive = true
    setError(null)
    setEditingCategories(false)
    liveSession.categories().then((cats) => {
      if (!alive) return
      setPlaylistCategories(cats)
      // Démarrage frais : aller sur la 1re vraie catégorie (sauf si on restaure un visionnage).
      const hidden = new Set(profileId ? settingsStore.getHiddenLiveCategoryIds(profileId) : [])
      const firstVisible = cats.find((cat) => !hidden.has(cat.id))
      if (firstVisible && !restoreRef.current) {
        setSelectedCat((cur) => (cur === FAV_ID ? firstVisible.id : cur))
      }
    }).catch((e) => { if (alive) setError(t('live.errorCategories', { message: (e as Error).message })) })
    return () => { alive = false }
  }, [profileId, attempt])

  // Si la catégorie courante vient d'être masquée, on bascule sur la première catégorie
  // encore visible. Favoris reste toujours disponible.
  // Attendre le chargement : sinon la catégorie restaurée au retour du lecteur est
  // remplacée par Favoris avant d'exister, et la chaîne regardée n'est jamais refocalisée.
  useEffect(() => {
    if (selectedCat === FAV_ID || playlistCategories.length === 0) return
    if (visiblePlaylistCategories.some((cat) => cat.id === selectedCat)) return
    setSelectedCat(visiblePlaylistCategories[0]?.id ?? FAV_ID)
  }, [selectedCat, playlistCategories, hiddenLiveCategoryIds.join('|')])

  // Chaînes brutes de la catégorie (le filtre Favoris est appliqué en rendu).
  useEffect(() => {
    let alive = true
    const favIdsNow = profileId ? favoritesStore.list(profileId) : []
    // Favoris sans favori : rien à charger (pas de fetch global coûteux).
    if (selectedCat === FAV_ID && favIdsNow.length === 0) {
      setLoaded([]); setLoadingChans(false); setFocused(null); setPreviewSrc(null)
      return
    }
    setLoadingChans(true)
    const catForLoad = selectedCat === FAV_ID ? '' : selectedCat
    liveSession.channels(catForLoad).then((list) => {
      if (!alive) return
      setLoaded(sortChannels(list))
      setLoadingChans(false)
      setFocused(null)
      setPreviewSrc(null)
    }).catch((e) => { if (alive) { setLoadingChans(false); setError(t('live.errorChannels', { message: (e as Error).message })) } })
    return () => { alive = false }
  }, [selectedCat, profileId, attempt])

  // Lecture EN RENDU des favoris → la liste réagit aux (dé)favoris (signal tracké).
  const favIds = profileId ? favoritesStore.list(profileId) : []
  const channels = useMemo(() => selectedCat === FAV_ID ? loaded.filter((c) => favIds.includes(c.id)) : loaded, [loaded, selectedCat, favIds.join('|')])

  function focusFirstChannel(): boolean {
    if (!channels[0]) return false
    return focusIfExists(channelFocusKey(channels[0].id))
  }

  function toggleCategoryVisibility(categoryId: string) {
    if (!profileId) return
    settingsStore.setLiveCategoryHidden(profileId, categoryId, !hiddenCategoryIdSet.has(categoryId))
  }

  function resetCategoryVisibility() {
    if (!profileId) return
    settingsStore.resetLiveCategoryVisibility(profileId)
  }

  // Au premier affichage du Direct, place le focus dans le contenu plutôt que de le
  // laisser sur le rail. Cela rend la navigation TV utilisable immédiatement.
  useEffect(() => {
    if (initialFocusDone.current || categories.length === 0 || editingCategories) return
    const currentFocus = getCurrentFocusKey()
    if (!currentFocus || currentFocus === 'nav-/direct' || currentFocus === 'SIDEBAR') {
      if (focusIfExists(categoryFocusKey(selectedCat)) || focusIfExists(LIVE_CATEGORIES)) {
        initialFocusDone.current = true
      }
    }
  }, [categories.length, editingCategories, selectedCat])

  // Si une liste est remplacée pendant que l'ancien élément était focalisé, on évite
  // un focus orphelin en revenant sur la première chaîne ou la catégorie courante.
  useEffect(() => {
    const currentFocus = getCurrentFocusKey()
    if (!currentFocus || !currentFocus.startsWith('chan-')) return
    if (channels.some((c) => channelFocusKey(c.id) === currentFocus)) return
    if (channels[0]) setFocus(channelFocusKey(channels[0].id))
    else focusIfExists(categoryFocusKey(selectedCat))
  }, [channels, selectedCat])

  // Aperçu vidéo (opt-in Réglages > Lecture) : 2e flux en sourdine après ~1 s de focus
  // stable. Coûte une 2e connexion IPTV → jamais pour la chaîne déjà en PIP.
  const previewOn = settingsStore.livePreview.value
  const playingId = nowPlaying.value?.channel.id
  useEffect(() => {
    setPreviewSrc(null)
    if (!previewOn || !focused || focused.id === playingId) return
    const timer = setTimeout(() => setPreviewSrc(liveStreamUrl(focused)), PREVIEW_DELAY)
    return () => clearTimeout(timer)
  }, [focused, previewOn, playingId])

  // Échec de l'aperçu : repli .ts (comme le lecteur principal), puis logo.
  function onPreviewError() {
    if (!focused) return
    const ts = liveStreamUrl(focused, 'ts')
    setPreviewSrc((cur) => (cur && cur !== ts ? ts : null))
  }

  // EPG now/next au focus.
  useEffect(() => {
    setEpg([])
    if (!focused) return
    let alive = true
    const refresh = () => liveSession.nowNext(focused.id).then((e) => { if (alive) setEpg(e) })
    const timer = setTimeout(refresh, 180)
    const interval = setInterval(refresh, 60_000)
    return () => { alive = false; clearTimeout(timer); clearInterval(interval) }
  }, [focused])

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {error && (
        <div style={{ position: 'absolute', top: 8, left: 12, right: 12, zIndex: 50, fontSize: 16, color: '#ff6b6b', background: 'var(--bg-elevated)', padding: 16 }}>
          <span role="alert">{error}</span> <ActionButton onPress={() => { setError(null); retry(n => n + 1) }}>{t('common.retry')}</ActionButton>
        </div>
      )}
      <CategoryList
        categories={categories}
        playlistCategories={playlistCategories}
        selectedId={selectedCat}
        hiddenCategoryIds={hiddenLiveCategoryIds}
        editing={editingCategories}
        onSelect={setSelectedCat}
        onMoveRight={focusFirstChannel}
        onStartEdit={() => setEditingCategories(true)}
        onStopEdit={() => setEditingCategories(false)}
        onToggleCategory={toggleCategoryVisibility}
        onResetVisibility={resetCategoryVisibility}
      />
      <ChannelList
        channels={channels}
        restoreChannelId={restoreRef.current?.channelId}
        loading={loadingChans}
        selectedCategoryId={selectedCat}
        onFocusChannel={ch => { setFocused(ch); if (restoreRef.current?.channelId === ch.id) restoreRef.current = null }}
        onPlay={(c) => startPlayback(c, selectedCat)}
      />
      <ChannelPreview
        channel={focused}
        epg={epg}
        nowSec={nowSec}
        previewSrc={previewSrc}
        onPreviewError={onPreviewError}
        isFavorite={focused ? favoritesStore.isFavorite(profileId, focused.id) : false}
        onPlay={() => focused && startPlayback(focused, selectedCat)}
        onToggleFavorite={() => focused && favoritesStore.toggle(profileId, focused.id)}
      />
    </div>
  )
}
