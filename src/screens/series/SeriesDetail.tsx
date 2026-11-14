import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useEffect, useState } from 'preact/hooks'
import { FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { useFocusable } from '../../navigation/spatial'
import type { Season, Episode } from '../../data/models'
import { seriesSession } from '../../data/series-session-instance'
import { continueWatchingStore } from '../../profiles/continue-watching'
import { favoritesStore } from '../../profiles/favorites'
import { profileStore } from '../../profiles/store'
import { navigate, rememberedFocus } from '../../router/router'
import { focusIfExists } from '../../navigation/focus'
import { selectedSeries } from './series-nav'
import { playEpisode } from '../player/playback'
import { t } from '../../i18n'

// ── Clés de focus ─────────────────────────────────────────────────────────────

/** Clé du conteneur boundary de la fiche série. */
const FOCUS_SERIES_DETAIL = 'series-detail'

/** Clé de focus d'un onglet de saison. */
function seasonTabKey(seasonNumber: number): string {
  return `season-${seasonNumber}`
}

/** Clé de focus d'une ligne d'épisode. */
function episodeKey(epId: string): string {
  return `ep-${encodeURIComponent(epId)}`
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Formate un nombre de secondes en "mm:ss". */
function formatMMSS(secs: number): string {
  const total = Math.max(0, Math.floor(secs))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Tente de focaliser une clé existante ; renvoie false si elle n'existe pas. */
function moveFocusTo(key: string): boolean {
  return !focusIfExists(key)
}

// ── Sous-composant : bouton TV focusable ──────────────────────────────────────

interface BtnProps {
  focusKey: string
  label: string
  onPress: () => void
  onArrowPress?: (direction: string) => boolean
  primary?: boolean
  active?: boolean
}

function Btn({ focusKey, label, onPress, onArrowPress, primary, active }: BtnProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onPress,
    onArrowPress,
  })
  useFocusScroll(ref, focused)
  return (
    <div
      ref={ref}
      data-focused={focused}
      role="button"
      onClick={onPress}
      style={{
        padding: '14px 28px',
        borderRadius: 10,
        fontSize: 22,
        fontWeight: active ? 800 : 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        background: focused
          ? 'var(--focus-bg)'
          : active
          ? 'var(--active-bg)'
          : primary
          ? 'var(--active-bg)'
          : 'var(--surface)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        border: (primary || active) && !focused ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background var(--dur) var(--ease), border-color var(--dur) var(--ease)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  )
}

// ── Sous-composant : ligne d'épisode ──────────────────────────────────────────

interface EpisodeRowProps {
  episode: Episode
  /** Position de reprise (secondes), 0 si aucune. */
  resumePosition: number
  onPlay: (ep: Episode, startPos: number) => void
  /** Callback onArrowPress pour gérer la navigation clavier. */
  onArrowPress: (direction: string) => boolean
}

function EpisodeRow({ episode, resumePosition, onPlay, onArrowPress }: EpisodeRowProps) {
  const { ref, focused } = useFocusable({
    focusKey: episodeKey(episode.id),
    onEnterPress: () => onPlay(episode, resumePosition > 10 ? resumePosition : 0),
    onArrowPress,
  })

  useFocusScroll(ref, focused)
  const hasResume = resumePosition > 10

  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={() => onPlay(episode, hasResume ? resumePosition : 0)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '16px 24px',
        borderRadius: 10,
        cursor: 'pointer',
        background: focused ? 'var(--focus-bg)' : 'transparent',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        border: '2px solid transparent',
        transition: 'background var(--dur) var(--ease)',
        marginBottom: 8,
      }}
    >
      {/* Numéro d'épisode */}
      <span
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-dim)',
          minWidth: 32,
          textAlign: 'end',
          flexShrink: 0,
        }}
      >
        {episode.episodeNumber}.
      </span>

      {/* Titre de l'épisode */}
      <span
        style={{
          fontSize: 22,
          fontWeight: focused ? 700 : 500,
          color: focused ? 'var(--text)' : 'var(--text)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {episode.title}
      </span>

      {/* Indication de reprise */}
      {hasResume && (
        <span
          style={{
            fontSize: 18,
            color: 'var(--accent)',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {t('series.resumeEpisode', { time: formatMMSS(resumePosition) })}
        </span>
      )}
    </div>
  )
}

// ── Composant principal : SeriesDetail ────────────────────────────────────────

/** Fiche détail d'une série : hero, favoris, onglets de saisons, liste d'épisodes. */
export function SeriesDetail() {
  const series = selectedSeries.value

  // État : saisons chargées depuis la session.
  const [seasons, setSeasons] = useState<Season[]>([])
  // État : numéro de saison sélectionné (null = pas encore chargé).
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)

  // Tous les hooks doivent être appelés AVANT tout return conditionnel.

  // Chargement des saisons (avec garde de nettoyage pour éviter les mises à jour orphelines).
  useEffect(() => {
    if (!series) return
    let alive = true
    seriesSession.seasons(series.id).then((loaded) => {
      if (!alive) return
      setSeasons(loaded)
      // Retour d'un épisode : rouvre sa saison ; sinon la première saison disponible.
      const backTo = rememberedFocus()
      const season = loaded.find((s) => s.episodes.some((ep) => episodeKey(ep.id) === backTo)) ?? loaded[0]
      if (season && selectedSeason === null) setSelectedSeason(season.seasonNumber)
    })
    return () => { alive = false }
  }, [series?.id])

  // Focus immédiat sur le bouton Favori au montage (D-pad réactif avant chargement des saisons).
  useEffect(() => {
    const t = setTimeout(() => setFocus('series-favorite'), 0)
    return () => clearTimeout(t)
  }, [])

  // Saisons chargées : focus sur l'épisode quitté (retour du lecteur), sinon le premier onglet.
  useEffect(() => {
    if (seasons.length === 0) return
    const t = setTimeout(() => focusIfExists(rememberedFocus()) || setFocus(seasonTabKey(seasons[0].seasonNumber)), 80)
    return () => clearTimeout(t)
  }, [seasons])

  // Redirection si aucune série sélectionnée (effet, jamais pendant le rendu).
  useEffect(() => {
    if (!series) navigate('/series', { replace: true })
  }, [series])

  // Conteneur focusable avec boundary (hook appelé AVANT tout return conditionnel).
  const { ref: containerRef, focusKey: containerFocusKey } = useFocusable({
    focusKey: FOCUS_SERIES_DETAIL,
    isFocusBoundary: true,
    saveLastFocusedChild: true,
    trackChildren: true,
  })

  // Lecture du signal de favoris pour la réactivité (déclenche un re-render à chaque changement).
  void favoritesStore.all.value

  // Si aucune série sélectionnée, afficher un état de chargement.
  if (!series) {
    return <div style={{ color: 'var(--text-dim)', padding: 48, fontSize: 24 }}>{t('common.loading')}</div>
  }

  // Capture non-nullable pour les closures (TS ne peut pas rétrécir le type Signal à travers les callbacks).
  const s = series

  const profileId = profileStore.vodProfileId.value
  const isFavorite = profileId ? favoritesStore.isFavorite(profileId, s.id) : false

  // Saison actuellement affichée dans la liste d'épisodes.
  const activeSeason = seasons.find((season) => season.seasonNumber === selectedSeason) ?? null
  const episodes = activeSeason?.episodes ?? []

  /** Bascule le favori pour la série. */
  function handleFavorite() {
    if (!profileId) return
    favoritesStore.toggle(profileId, s.id)
  }

  /** Lance la lecture d'un épisode avec la position de reprise donnée. */
  function handlePlayEpisode(ep: Episode, startPos: number) {
    playEpisode(ep, s, startPos)
  }

  /** Callback onArrowPress pour les onglets de saison (gauche → rail nav). */
  function seasonTabArrowPress(direction: string): boolean {
    if (direction === 'left') return moveFocusTo('nav-/series')
    return true
  }

  /** Callback onArrowPress pour les lignes d'épisodes (gauche → rail nav). */
  function episodeArrowPress(direction: string): boolean {
    if (direction === 'left') return moveFocusTo('nav-/series')
    return true
  }

  return (
    <FocusContext.Provider value={containerFocusKey}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          color: 'var(--text)',
          background: 'var(--bg)',
        }}
      >
        {/* ── Hero : poster + dégradé ── */}
        {s.poster && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 480,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={s.poster}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Dégradé bas pour lisibilité du texte superposé */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.70) 78%, var(--bg) 100%)',
              }}
            />
          </div>
        )}

        {/* ── Contenu principal (chevauchant le dégradé du hero) ── */}
        <div
          style={{
            position: s.poster ? 'relative' : undefined,
            marginTop: s.poster ? -100 : 0,
            padding: '0 72px 72px',
            zIndex: 2,
          }}
        >
          {/* Titre de la série */}
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1.08,
              margin: '0 0 16px 0',
            }}
          >
            {s.name}
          </h1>

          {/* Synopsis */}
          {s.plot && (
            <p
              style={{
                fontSize: 21,
                lineHeight: 1.6,
                color: 'var(--text-dim)',
                maxWidth: 820,
                margin: '0 0 28px 0',
              }}
            >
              {s.plot}
            </p>
          )}

          {/* Bouton Favori */}
          <div style={{ marginBottom: 40 }}>
            <Btn
              focusKey="series-favorite"
              label={isFavorite ? t('common.removeFavorite') : t('common.addFavorite')}
              onPress={handleFavorite}
              onArrowPress={(direction) => {
                if (direction === 'left') return moveFocusTo('nav-/series')
                return true
              }}
            />
          </div>

          {/* ── Onglets de saisons (navigation horizontale) ── */}
          {seasons.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 32,
              }}
            >
              {seasons.map((season) => (
                <Btn
                  key={season.seasonNumber}
                  focusKey={seasonTabKey(season.seasonNumber)}
                  label={t('series.season', { number: season.seasonNumber })}
                  onPress={() => setSelectedSeason(season.seasonNumber)}
                  onArrowPress={seasonTabArrowPress}
                  active={season.seasonNumber === selectedSeason}
                />
              ))}
            </div>
          )}

          {/* ── Liste des épisodes de la saison sélectionnée ── */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              border: '1px solid var(--glass-border)',
              overflow: 'hidden',
              padding: '8px 0',
            }}
          >
            {episodes.length === 0 && (
              <div
                style={{
                  padding: '32px 24px',
                  color: 'var(--text-dim)',
                  fontSize: 20,
                  textAlign: 'center',
                }}
              >
                {seasons.length === 0 ? t('series.loadingEpisodes') : t('series.noEpisodes')}
              </div>
            )}

            {episodes.map((ep) => {
              // Récupère la position de reprise pour cet épisode (si profil actif).
              const resumeEntry = profileId ? continueWatchingStore.get(profileId, ep.id) : null
              const resumePos = resumeEntry?.position ?? 0

              return (
                <EpisodeRow
                  key={ep.id}
                  episode={ep}
                  resumePosition={resumePos}
                  onPlay={handlePlayEpisode}
                  onArrowPress={episodeArrowPress}
                />
              )
            })}
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}
