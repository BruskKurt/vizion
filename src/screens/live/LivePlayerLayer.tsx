import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { Channel, EpgEntry } from '../../data/models'
import { liveSession } from '../../data/session-instance'
import { navigate } from '../../router/router'
import { useBackHandler } from '../../navigation/back-handlers'
import { VideoPlayer } from '../../components/VideoPlayer'
import { Icon, type IconName } from '../../components/Icons'
import { PlayerInfoBar } from './PlayerInfoBar'
import { GuideOverlay } from './GuideOverlay'
import { nowPlaying, setNowPlaying, stopPlaying } from './now-playing'
import { liveStreamUrl } from './stream-url'
import { FAV_ID, rememberPlaybackTarget } from './playback'
import { focusIfExists } from '../../navigation/focus'
import { LIVE_PREVIEW, PREVIEW_PLAY } from './focus-keys'
import { t } from '../../i18n'

const INFO_TIMEOUT = 4000

// ── Contrôles du PIP (focusables au D-pad) ──────────────────────────────────
function PipBtn(props: { focusKey: string; icon: IconName; onPress: () => void; onArrowPress?: (dir: string) => boolean }) {
  const { ref, focused } = useFocusable({
    focusKey: props.focusKey,
    onEnterPress: props.onPress,
    onArrowPress: props.onArrowPress,
  })
  return (
    <div
      ref={ref}
      onClick={props.onPress}
      style={{
        width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        background: focused ? 'var(--focus-bg)' : 'rgba(0,0,0,0.72)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease)',
      }}
    >
      <Icon name={props.icon} size={25} />
    </div>
  )
}

function PipControls(props: { paused: boolean; onFullscreen: () => void; onTogglePause: () => void; onClose: () => void }) {
  const { ref, focusKey } = useFocusable({ focusKey: 'PIP', saveLastFocusedChild: true, trackChildren: true })

  // Flèche haut depuis le PIP : retour au panneau de prévisualisation.
  function handlePipArrow(dir: string): boolean {
    if (dir === 'up') {
      if (focusIfExists(PREVIEW_PLAY)) return false
      if (focusIfExists(LIVE_PREVIEW)) return false
    }
    return true
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center', gap: 14, padding: '24px 0 12px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
        }}
      >
        <PipBtn focusKey="pip-full" icon="expand" onPress={props.onFullscreen} onArrowPress={handlePipArrow} />
        <PipBtn focusKey="pip-pause" icon={props.paused ? 'play' : 'pause'} onPress={props.onTogglePause} onArrowPress={handlePipArrow} />
        <PipBtn focusKey="pip-close" icon="close" onPress={props.onClose} onArrowPress={handlePipArrow} />
      </div>
    </FocusContext.Provider>
  )
}

/**
 * Couche de lecture persistante. Montée tant qu'une chaîne joue (nowPlaying), elle ne se
 * démonte PAS au retour vers le browse → la lecture continue et le retour est instantané.
 * `fullscreen` active l'UI de contrôle et la prise en charge des touches.
 */
export function LivePlayerLayer({ fullscreen }: { fullscreen: boolean }) {
  const playing = nowPlaying.value
  const [channels, setChannels] = useState<Channel[]>([])
  const [epg, setEpg] = useState<EpgEntry[]>([])
  const [infoVisible, setInfoVisible] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [statsOn, setStatsOn] = useState(false)
  const [ext, setExt] = useState<string | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000))
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const digitsRef = useRef<string>('')
  const digitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categoryId = playing?.categoryId ?? ''
  const current = playing?.channel ?? null
  const index = current ? channels.findIndex((c) => c.id === current.id) : -1

  // Horloge pour la progression EPG.
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30000)
    return () => clearInterval(id)
  }, [])

  // Liste de chaînes de la catégorie en cours (pour le zapping / guide).
  useEffect(() => {
    if (!playing) return
    let alive = true
    liveSession.channels(categoryId === FAV_ID ? '' : categoryId).then((list) => {
      if (alive) setChannels(list)
    })
    return () => { alive = false }
  }, [categoryId])

  // EPG + remise à zéro du repli/erreur/pause au changement de chaîne.
  useEffect(() => {
    setExt(undefined)
    setFailed(false)
    setPaused(false)
    if (!current) return
    let alive = true
    liveSession.nowNext(current.id).then((e) => { if (alive) setEpg(e) })
    return () => { alive = false }
  }, [current?.id])

  function flashInfo() {
    setInfoVisible(true)
    if (infoTimer.current) clearTimeout(infoTimer.current)
    infoTimer.current = setTimeout(() => setInfoVisible(false), INFO_TIMEOUT)
  }
  // Réaffiche l'info au passage en plein écran et au changement de chaîne.
  useEffect(() => {
    if (fullscreen) flashInfo()
    return () => { if (infoTimer.current) clearTimeout(infoTimer.current) }
  }, [fullscreen, current?.id])

  function zapTo(i: number) {
    if (channels.length === 0 || !playing) return
    const next = channels[(i + channels.length) % channels.length]
    if (next) {
      rememberPlaybackTarget(next, categoryId)
      setNowPlaying(next, categoryId)
    }
  }

  function onPlaybackError() {
    if (ext === undefined) setExt('ts')
    else setFailed(true)
  }

  // Back avec le guide ouvert : ferme le guide (sinon App revient à la page précédente).
  useBackHandler(useCallback(() => { setGuideOpen(false); return true }, []), fullscreen && guideOpen)

  // Touches actives uniquement en plein écran (sinon le browse gère le clavier).
  useEffect(() => {
    if (!fullscreen) return
    function onKey(e: KeyboardEvent) {
      const code = e.keyCode
      if (guideOpen) return
      if (code === 38) { e.preventDefault(); flashInfo(); zapTo(index - 1) }
      else if (code === 40) { e.preventDefault(); flashInfo(); zapTo(index + 1) }
      else if (code === 13) { e.preventDefault(); setGuideOpen(true) }
      else if (code === 415) { e.preventDefault(); setPaused(false); flashInfo() }
      else if (code === 19) { e.preventDefault(); setPaused(true); flashInfo() }
      else if (code === 10252) { e.preventDefault(); setPaused((p) => !p); flashInfo() }
      else if ((code >= 48 && code <= 57) || (code >= 96 && code <= 105)) {
        e.preventDefault()
        digitsRef.current += String(code >= 96 ? code - 96 : code - 48)
        flashInfo()
        if (digitTimer.current) clearTimeout(digitTimer.current)
        digitTimer.current = setTimeout(() => {
          const num = Number(digitsRef.current)
          const i = channels.findIndex((c) => c.number === num)
          if (i >= 0) zapTo(i)
          digitsRef.current = ''
        }, 1500)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (digitTimer.current) clearTimeout(digitTimer.current)
    }
  }, [fullscreen, guideOpen, channels, index])

  if (!current) return null

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <VideoPlayer key={`${current.id}-${ext ?? 'default'}`} src={liveStreamUrl(current, ext)} paused={paused} showStats={fullscreen && statsOn} onError={onPlaybackError} />

      {/* PIP (mode réduit) : contrôles focusables Plein écran / Pause / Fermer. */}
      {!fullscreen && (
        <PipControls
          paused={paused}
          onFullscreen={() => navigate('/direct/play')}
          onTogglePause={() => setPaused((p) => !p)}
          onClose={() => stopPlaying()}
        />
      )}

      {/* UI de contrôle uniquement en plein écran */}
      {fullscreen && (
        <>
          {failed && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', gap: 10 }}>
              <div style={{ fontSize: 40 }}>{t('live.playbackImpossible')}</div>
              <div style={{ fontSize: 24 }}>{t('live.streamUnavailable')}</div>
            </div>
          )}
          <PlayerInfoBar channel={current} epg={epg} nowSec={nowSec} visible={infoVisible && !guideOpen} />
          {infoVisible && !guideOpen && paused && (
            <div style={{ position: 'absolute', top: 32, right: 48, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', background: 'rgba(0,0,0,0.72)', borderRadius: 10, pointerEvents: 'none' }}>
              <Icon name="pause" size={28} />
            </div>
          )}
          {guideOpen && (
            <GuideOverlay
              channels={channels}
              currentId={current.id}
              statsOn={statsOn}
              onToggleStats={() => setStatsOn((s) => !s)}
              onSelect={(i) => { zapTo(i); setGuideOpen(false) }}
            />
          )}
        </>
      )}
    </div>
  )
}
