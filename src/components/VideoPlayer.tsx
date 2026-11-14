import { recordMetric } from '../diagnostics/performance'
import { useRef, useEffect, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import { getLocalIp } from '../webos/network'
import { t } from '../i18n'

interface VideoStats {
  res: string
  fps: number
  dropped: number
  /** Débit instantané estimé (Mb/s) à partir des octets décodés. */
  mbps: number
  /** Secondes de mémoire tampon en avance. */
  buffer: number
}

function streamFormat(src: string): string {
  if (src.includes('.m3u8')) return 'HLS'
  if (src.includes('.ts')) return 'MPEG-TS'
  if (src.includes('.mpd')) return 'DASH'
  return '—'
}

interface Props {
  src: string
  muted?: boolean
  /** Met la lecture en pause sans démonter l'élément. */
  paused?: boolean
  /** Affiche un spinner pendant la mise en mémoire tampon (défaut : true). */
  showBuffering?: boolean
  /** Affiche un overlay de stats (résolution, fps réels, images perdues). */
  showStats?: boolean
  style?: JSX.CSSProperties
  onError?: () => void
  /** Position de départ (s) : appliquée une seule fois sur loadedmetadata. */
  startPosition?: number
  /** Commande de seek : chaque nouvelle valeur finie déplace la tête de lecture. */
  seekTo?: number
  /** Appelé ~1 fois/s avec la position et la durée courantes (VOD). */
  onProgress?: (cur: number, dur: number) => void
}

export function VideoPlayer({ src, muted = false, paused = false, showBuffering = true, showStats = false, style, onError, startPosition, seekTo, onProgress }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const playbackStarted = useRef<number | null>(null)
  const [buffering, setBuffering] = useState(true)
  const [stats, setStats] = useState<VideoStats | null>(null)
  const [ip, setIp] = useState('')
  /** Dernier seekTo appliqué : évite de rejouer le même seek. */
  const lastSeekRef = useRef<number | undefined>(undefined)
  /** Horodatage du dernier appel à onProgress (throttle ~1 s). */
  const lastProgressRef = useRef<number>(0)

  // IP locale de la TV (service réseau webOS) — récupérée une fois quand les stats sont actives.
  useEffect(() => {
    if (showStats && !ip) getLocalIp(setIp)
  }, [showStats])

  // Mesure des fps/débit/buffer via getVideoPlaybackQuality + octets décodés (plan matériel webOS).
  useEffect(() => {
    if (!showStats) return
    let prevFrames = 0
    let prevBytes = 0
    let prevTime = Date.now()
    const id = setInterval(() => {
      const v = ref.current as unknown as (HTMLVideoElement & {
        getVideoPlaybackQuality?: () => { totalVideoFrames: number; droppedVideoFrames: number }
        webkitVideoDecodedByteCount?: number
        webkitAudioDecodedByteCount?: number
      }) | null
      if (!v) return
      const q = v.getVideoPlaybackQuality?.()
      const now = Date.now()
      const dt = (now - prevTime) / 1000 || 1
      const frames = q?.totalVideoFrames ?? 0
      const bytes = (v.webkitVideoDecodedByteCount ?? 0) + (v.webkitAudioDecodedByteCount ?? 0)
      const fps = Math.round((frames - prevFrames) / dt)
      const mbps = prevBytes > 0 ? Math.round(((bytes - prevBytes) * 8) / dt / 1e5) / 10 : 0
      let buffer = 0
      try {
        if (v.buffered.length) buffer = Math.max(0, Math.round(v.buffered.end(v.buffered.length - 1) - v.currentTime))
      } catch { /* buffered indisponible */ }
      prevFrames = frames
      prevBytes = bytes
      prevTime = now
      setStats({ res: `${v.videoWidth}×${v.videoHeight}`, fps, dropped: q?.droppedVideoFrames ?? 0, mbps, buffer })
    }, 1000)
    return () => clearInterval(id)
  }, [showStats, src])

  useEffect(() => {
    const v = ref.current
    if (!v || !src) return
    setBuffering(true)
    playbackStarted.current = performance.now()
    v.src = src
    try {
      v.load()
      // play() peut être indisponible (jsdom) ou rejeté (autoplay) : on ignore proprement.
      const p = v.play() as Promise<void> | undefined
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {
      /* environnement sans média (tests) */
    }
    // Libère la connexion IPTV immédiatement (sinon webOS garde le flux jusqu'au GC,
    // ce qui compte double sur les abonnements limités en connexions).
    return () => {
      v.removeAttribute('src')
      try { v.load() } catch { /* environnement sans média (tests) */ }
    }
  }, [src])

  // Play/pause sans recharger la source.
  useEffect(() => {
    const v = ref.current
    if (!v) return
    try {
      if (paused) v.pause()
      else {
        const p = v.play() as Promise<void> | undefined
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    } catch {
      /* environnement sans média (tests) */
    }
  }, [paused])

  // Applique le seek à chaque nouvelle valeur de seekTo (si différente du dernier seek appliqué).
  useEffect(() => {
    if (seekTo === undefined || !isFinite(seekTo)) return
    if (seekTo === lastSeekRef.current) return
    const v = ref.current
    if (!v) return
    lastSeekRef.current = seekTo
    v.currentTime = seekTo
  }, [seekTo])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <video
        ref={ref}
        muted={muted}
        autoPlay
        onError={onError}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); if (playbackStarted.current !== null) { recordMetric('playback', performance.now() - playbackStarted.current); playbackStarted.current = null } }}
        onCanPlay={() => setBuffering(false)}
        onLoadedMetadata={() => {
          // Positionne la tête de lecture au point de reprise (VOD uniquement, une seule fois).
          const v = ref.current
          if (v && startPosition && startPosition > 0) v.currentTime = startPosition
        }}
        onTimeUpdate={() => {
          // Throttle : émet onProgress au plus une fois par seconde.
          if (!onProgress) return
          const now = Date.now()
          if (now - lastProgressRef.current < 1000) return
          lastProgressRef.current = now
          const v = ref.current
          if (!v) return
          onProgress(v.currentTime, v.duration || 0)
        }}
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
      />
      {showBuffering && buffering && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '5px solid rgba(255,255,255,0.28)',
              borderTopColor: 'rgba(255,255,255,0.78)',
              animation: 'loading-spin 850ms linear infinite',
            }}
          />
        </div>
      )}
      {showStats && stats && (
        <div
          style={{
            position: 'absolute', top: 12, left: 12, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(0,0,0,0.65)', color: '#7dffa0', fontSize: 15, lineHeight: 1.5, fontFamily: 'monospace',
            pointerEvents: 'none', whiteSpace: 'pre',
          }}
        >
          {[
            `${t('stats.format')}    ${streamFormat(src)}`,
            `${t('stats.resolution')} ${stats.res}`,
            `${t('stats.frames')}     ${stats.fps} fps · ${stats.dropped} ${t('stats.dropped')}`,
            `${t('stats.bitrate')}      ${stats.mbps} Mb/s`,
            `${t('stats.buffer')}     ${stats.buffer}s`,
            ip ? `${t('stats.ipTv')}      ${ip}` : '',
          ].filter(Boolean).join('\n')}
        </div>
      )}
    </div>
  )
}
