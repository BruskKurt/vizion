import { useEffect, useState } from 'preact/hooks'
import { FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { useFocusable } from '../../navigation/spatial'
import type { MovieInfo } from '../../data/models'
import { vodSession } from '../../data/vod-session-instance'
import { continueWatchingStore } from '../../profiles/continue-watching'
import { favoritesStore } from '../../profiles/favorites'
import { profileStore } from '../../profiles/store'
import { navigate } from '../../router/router'
import { focusIfExists } from '../../navigation/focus'
import { selectedMovie } from './vod-nav'
import { playMovie } from './vod-playback'
import { MOVIE_DETAIL_FAVORITE, MOVIE_DETAIL_PLAY, MOVIE_DETAIL_RESTART } from './vod-focus-keys'
import { t } from '../../i18n'

/** Formate un nombre de secondes en "Xh Ymin" ou "Ymin". */
function formatDuration(secs: number): string {
  const total = Math.max(0, Math.floor(secs))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

/** Formate un nombre de secondes en "mm:ss". */
function formatMMSS(secs: number): string {
  const total = Math.max(0, Math.floor(secs))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const FOCUS_DETAIL = 'movie-detail'

interface BtnProps {
  focusKey: string
  label: string
  onPress: () => void
  onArrowPress?: (direction: string) => boolean
  primary?: boolean
}

function moveFocusTo(focusKey: string): boolean {
  return !focusIfExists(focusKey)
}

function Btn({ focusKey, label, onPress, onArrowPress, primary }: BtnProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onPress,
    onArrowPress,
  })
  return (
    <div
      ref={ref}
      role="button"
      onClick={onPress}
      style={{
        padding: '18px 32px',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        background: focused
          ? 'var(--focus-bg)'
          : primary
          ? 'var(--active-bg)'
          : 'var(--surface)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        border: primary && !focused ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background var(--dur) var(--ease), border-color var(--dur) var(--ease)',
      }}
    >
      {label}
    </div>
  )
}

/** Fiche détail d'un film : hero, méta, synopsis, boutons d'action. */
export function MovieDetail() {
  const movie = selectedMovie.value

  const [info, setInfo] = useState<MovieInfo | null>(null)

  // Charge les infos enrichies depuis la session VOD.
  useEffect(() => {
    if (!movie) return
    let alive = true
    vodSession.info(movie.id).then((i) => {
      if (alive) setInfo(i)
    })
    return () => { alive = false }
  }, [movie?.id])

  // Focus initial sur le premier bouton dès le montage.
  useEffect(() => {
    const t = setTimeout(() => setFocus(MOVIE_DETAIL_PLAY), 80)
    return () => clearTimeout(t)
  }, [])

  // Redirection si aucun film sélectionné (effet, jamais pendant le rendu).
  useEffect(() => {
    if (!movie) navigate('/films', { replace: true })
  }, [movie])

  // Conteneur focusable (hook appelé AVANT tout return conditionnel).
  const { ref, focusKey } = useFocusable({
    focusKey: FOCUS_DETAIL,
    isFocusBoundary: true,
    preferredChildFocusKey: MOVIE_DETAIL_PLAY,
    saveLastFocusedChild: true,
    trackChildren: true,
  })

  // Si aucun film sélectionné (la redirection est gérée par l'effet ci-dessus).
  if (!movie) {
    return <div style={{ color: 'var(--text-dim)', padding: 48, fontSize: 24 }}>{t('common.loading')}</div>
  }

  // Capture non-nullable pour les closures (TS ne peut pas rétrécir le type Signal à travers les callbacks).
  const m = movie

  const profileId = profileStore.vodProfileId.value
  const resume = profileId ? continueWatchingStore.get(profileId, m.id) : null
  const hasResume = resume !== null && resume.position > 10

  // isFavorite est lu via .value pour être réactif aux changements de signal.
  const isFavorite = profileId ? favoritesStore.isFavorite(profileId, m.id) : false
  // Lecture du signal directement pour la réactivité (favoritesStore.all.value déclenche le re-render).
  void favoritesStore.all.value

  function handlePlay() {
    playMovie(m, hasResume ? resume!.position : 0)
  }

  function handleRestart() {
    playMovie(m, 0)
  }

  function handleFavorite() {
    if (!profileId) return
    favoritesStore.toggle(profileId, m.id)
  }

  const backdrop = info?.backdrop ?? m.poster
  const year = info?.year
  const duration = info?.durationSecs ? formatDuration(info.durationSecs) : null
  const rating = info?.rating ?? m.rating

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          color: 'var(--text)',
          background: 'var(--bg)',
        }}
      >
        {/* ── Hero (backdrop / poster) ── */}
        {backdrop && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 520,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={backdrop}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Dégradé pour lisibilité */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.72) 80%, var(--bg) 100%)',
              }}
            />
          </div>
        )}

        {/* ── Contenu ── */}
        <div
          style={{
            position: backdrop ? 'relative' : undefined,
            marginTop: backdrop ? -120 : 0,
            padding: '0 72px 72px',
            zIndex: 2,
          }}
        >
          {/* Titre */}
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1.08,
              margin: '0 0 18px 0',
              letterSpacing: 0,
            }}
          >
            {m.name}
          </h1>

          {/* Ligne méta : année · durée · note */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontSize: 22,
              color: 'var(--text-dim)',
              marginBottom: 32,
              alignItems: 'center',
            }}
          >
            {year && <span>{year}</span>}
            {duration && <span>{duration}</span>}
            {rating != null && <span>★ {Number(rating).toFixed(1)}</span>}
            {info?.genre && <span style={{ fontStyle: 'italic' }}>{info.genre}</span>}
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
            {hasResume ? (
              <>
                <Btn
                  focusKey={MOVIE_DETAIL_PLAY}
                  label={t('common.resumeAt', { time: formatMMSS(resume!.position) })}
                  onPress={handlePlay}
                  onArrowPress={(direction) => {
                    if (direction === 'left') return moveFocusTo('nav-/films')
                    if (direction === 'right') return moveFocusTo(MOVIE_DETAIL_RESTART)
                    return true
                  }}
                  primary
                />
                <Btn
                  focusKey={MOVIE_DETAIL_RESTART}
                  label={t('common.restart')}
                  onPress={handleRestart}
                  onArrowPress={(direction) => {
                    if (direction === 'left') return moveFocusTo(MOVIE_DETAIL_PLAY)
                    if (direction === 'right') return moveFocusTo(MOVIE_DETAIL_FAVORITE)
                    return true
                  }}
                />
              </>
            ) : (
              <Btn
                focusKey={MOVIE_DETAIL_PLAY}
                label={t('common.play')}
                onPress={handlePlay}
                onArrowPress={(direction) => {
                  if (direction === 'left') return moveFocusTo('nav-/films')
                  if (direction === 'right') return moveFocusTo(MOVIE_DETAIL_FAVORITE)
                  return true
                }}
                primary
              />
            )}
            <Btn
              focusKey={MOVIE_DETAIL_FAVORITE}
              label={isFavorite ? t('common.remove') : t('common.favorite')}
              onPress={handleFavorite}
              onArrowPress={(direction) => {
                if (direction === 'left') return moveFocusTo(hasResume ? MOVIE_DETAIL_RESTART : MOVIE_DETAIL_PLAY)
                return true
              }}
            />
          </div>

          {/* Synopsis */}
          {info?.plot && (
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.6,
                color: 'var(--text-dim)',
                maxWidth: 860,
                margin: 0,
              }}
            >
              {info.plot}
            </p>
          )}

          {/* Fiche technique (casting / réalisateur) */}
          {(info?.director || info?.cast) && (
            <div style={{ marginTop: 28, fontSize: 19, color: 'var(--text-dim)' }}>
              {info.director && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{t('movie.director')}</span>
                  {info.director}
                </div>
              )}
              {info.cast && (
                <div>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{t('movie.cast')}</span>
                  {info.cast}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </FocusContext.Provider>
  )
}
