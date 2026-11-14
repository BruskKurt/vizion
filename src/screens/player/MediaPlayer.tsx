import { useEffect, useRef, useState } from 'preact/hooks'
import { VideoPlayer } from '../../components/VideoPlayer'
import { Icon } from '../../components/Icons'
import { navigate, back } from '../../router/router'
import { profileStore } from '../../profiles/store'
import { continueWatchingStore } from '../../profiles/continue-watching'
import { playbackTarget, mediaStreamUrl } from './playback'
import { t } from '../../i18n'

// Délai d'auto-masquage des contrôles (ms)
const CONTROLS_TIMEOUT = 4000

/** Formate un nombre de secondes en mm:ss. */
function formatTime(s: number): string {
  const sec = Math.max(0, Math.floor(isFinite(s) ? s : 0))
  const m = Math.floor(sec / 60)
  const r = sec % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

/** Lecteur média plein écran (films et épisodes) avec seek, reprise, sauvegarde de position. */
export function MediaPlayer() {
  const target = playbackTarget.value

  const [paused, setPaused] = useState(false)
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined)
  const [progress, setProgress] = useState({ cur: 0, dur: 0 })
  const [controlsVisible, setControlsVisible] = useState(true)

  // Ref vers la progression courante — utilisé dans le cleanup sans capturer une valeur figée.
  const progressRef = useRef(progress)
  progressRef.current = progress

  // Position cible cumulée pour les seeks relatifs : indépendante du throttle d'onProgress,
  // pour que des appuis rapides (← →) s'additionnent sans dériver.
  const seekBaseRef = useRef(target?.startPosition ?? 0)
  // Horodatage de la dernière sauvegarde (sauvegarde périodique pendant la lecture).
  const lastSaveRef = useRef(0)

  // Ref pour le timer d'auto-masquage des contrôles.
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function flashControls() {
    setControlsVisible(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_TIMEOUT)
  }

  // Flash initial des contrôles à l'entrée dans le lecteur.
  useEffect(() => {
    flashControls()
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current) }
  }, [])

  // Sauvegarde de la position courante dans le store "continuer à regarder".
  function savePosition() {
    const profileId = profileStore.vodProfileId.value
    const { cur, dur } = progressRef.current
    if (profileId && target && dur > 0) {
      continueWatchingStore.save(
        profileId,
        {
          kind: target.kind,
          id: target.id,
          name: target.name,
          poster: target.poster,
          containerExtension: target.containerExtension,
          seriesName: target.seriesName,
        },
        cur,
        dur,
        Date.now(),
      )
    }
  }

  // Sauvegarde automatique au démontage du composant.
  useEffect(() => {
    return () => { savePosition() }
  }, [target])

  // Redirection si aucune cible (effet, pas pendant le rendu).
  useEffect(() => {
    if (!target) navigate('/direct')
  }, [target])

  // Gestion des touches télécommande / clavier.
  useEffect(() => {
    if (!target) return
    function onKey(e: KeyboardEvent) {
      const code = e.keyCode
      const { dur } = progressRef.current

      if (code === 415) {
        // Touche Play
        e.preventDefault(); setPaused(false); flashControls()
      } else if (code === 19) {
        // Touche Pause
        e.preventDefault(); setPaused(true); flashControls()
      } else if (code === 10252) {
        // Touche PlayPause (bascule)
        e.preventDefault(); setPaused((p) => !p); flashControls()
      } else if (code === 13) {
        // OK → bascule pause + affiche contrôles
        e.preventDefault(); setPaused((p) => !p); flashControls()
      } else if (code === 37) {
        // Flèche gauche → recul de 10 s (cumulatif via seekBaseRef)
        e.preventDefault()
        const t = Math.max(0, seekBaseRef.current - 10)
        seekBaseRef.current = t
        setSeekTo(t)
        flashControls()
      } else if (code === 39) {
        // Flèche droite → avance de 10 s (cumulatif ; clamp à la durée si connue)
        e.preventDefault()
        const limit = dur > 0 ? dur : Infinity
        const t = Math.min(limit, seekBaseRef.current + 10)
        seekBaseRef.current = t
        setSeekTo(t)
        flashControls()
      } else if (code === 461 || code === 8 || code === 27) {
        // Retour → la sauvegarde est faite au démontage (cleanup). On revient simplement.
        e.preventDefault()
        back()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [target])

  // Si aucune cible n'est définie (la redirection est gérée par l'effet ci-dessus).
  if (!target) {
    return <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>{t('common.loading')}</div>
  }

  const { cur, dur } = progress
  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      {/* Lecteur vidéo */}
      <VideoPlayer
        src={mediaStreamUrl(target)}
        startPosition={target.startPosition}
        seekTo={seekTo}
        paused={paused}
        onProgress={(c, d) => {
          const next = { cur: c, dur: d }
          progressRef.current = next
          seekBaseRef.current = c
          setProgress(next)
          // Sauvegarde périodique (~toutes les 15 s) pour survivre à un arrêt brutal.
          const now = Date.now()
          if (now - lastSaveRef.current > 15000) {
            lastSaveRef.current = now
            savePosition()
          }
        }}
      />

      {/* Overlay contrôles (auto-masqué) */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity var(--dur) var(--ease)',
        }}
      >
        {/* Dégradé bas + contrôles */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '64px 72px 46px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
          }}
        >
          {/* Titre du contenu (film ou épisode) */}
          <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{target.name}</div>

          {/* Barre de progression */}
          <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4 }} />
          </div>

          {/* Temps + état de lecture */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 20 }}>
            <span style={{ width: 30, display: 'flex', justifyContent: 'center' }}>
              <Icon name={paused ? 'pause' : 'play'} size={26} />
            </span>
            <span>{formatTime(cur)} / {formatTime(dur)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
