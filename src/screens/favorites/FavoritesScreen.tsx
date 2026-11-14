import { useEffect, useState } from 'preact/hooks'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { Channel, Movie, Series } from '../../data/models'
import { liveSession } from '../../data/session-instance'
import { vodSession } from '../../data/vod-session-instance'
import { seriesSession } from '../../data/series-session-instance'
import { favoritesStore } from '../../profiles/favorites'
import { profileStore } from '../../profiles/store'
import { focusIfExists } from '../../navigation/focus'
import { rememberedFocus } from '../../router/router'
import { PosterTile } from '../media/PosterTile'
import { startPlayback } from '../live/playback'
import { openMovie } from '../vod/vod-nav'
import { openSeries } from '../series/series-nav'
import { t } from '../../i18n'

interface SectionProps {
  title: string
  focusPrefix: string
  items: Array<{ id: string; name: string; poster?: string }>
  onSelect: (id: string) => void
}

function Section({ title, focusPrefix, items, onSelect }: SectionProps) {
  const { ref, focusKey } = useFocusable({ focusable: items.length > 0, saveLastFocusedChild: true, trackChildren: true })
  if (items.length === 0) return <div ref={ref} style={{ display: 'none' }} />
  return (
    <FocusContext.Provider value={focusKey}>
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 14px 4px' }}>{title}</h2>
        <div ref={ref} style={{ display: 'flex', flexDirection: 'row', gap: 16, overflowX: 'auto' }}>
          {items.map((it, idx) => (
            <PosterTile
              key={it.id}
              focusKey={`fav-${focusPrefix}-${it.id}`}
              item={it}
              onSelect={() => onSelect(it.id)}
              onArrowPress={(direction) => {
                if (direction === 'left' && idx === 0) return !focusIfExists('nav-/favoris')
                return true
              }}
            />
          ))}
        </div>
      </div>
    </FocusContext.Provider>
  )
}

/** Écran Favoris : regroupe chaînes (profil Direct) + films & séries (profil Films) favoris. */
export function FavoritesScreen() {
  const livePid = profileStore.liveProfileId.value ?? ''
  const vodPid = profileStore.vodProfileId.value ?? ''
  // Lecture du signal pour réagir aux (dé)favoris.
  const favMap = favoritesStore.all.value
  const [chans, setChans] = useState<Channel[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const favCh = livePid ? favoritesStore.list(livePid) : []
    const favVod = vodPid ? favoritesStore.list(vodPid) : []
    Promise.all([
      favCh.length ? liveSession.channels('').catch(() => [] as Channel[]) : Promise.resolve([] as Channel[]),
      favVod.length ? vodSession.streams('').catch(() => [] as Movie[]) : Promise.resolve([] as Movie[]),
      favVod.length ? seriesSession.list('').catch(() => [] as Series[]) : Promise.resolve([] as Series[]),
    ]).then(([ch, mv, sr]) => {
      if (!alive) return
      setChans(ch.filter((c) => favCh.includes(c.id)))
      setMovies(mv.filter((m) => favVod.includes(m.id)))
      setSeries(sr.filter((s) => favVod.includes(s.id)))
      setLoading(false)
    })
    return () => { alive = false }
  }, [livePid, vodPid, favMap])

  const isEmpty = !loading && chans.length === 0 && movies.length === 0 && series.length === 0
  const { ref: rootRef, focusKey: rootKey } = useFocusable({ focusKey: 'favorites-root', focusable: !loading && !isEmpty, saveLastFocusedChild: true, trackChildren: true })

  // Focus initial : favori ouvert avant le Back, sinon le premier disponible une fois chargé.
  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => {
      if (focusIfExists(rememberedFocus())) return
      if (chans[0]) focusIfExists(`fav-channels-${chans[0].id}`)
      else if (movies[0]) focusIfExists(`fav-movies-${movies[0].id}`)
      else if (series[0]) focusIfExists(`fav-series-${series[0].id}`)
    }, 80)
    return () => clearTimeout(t)
  }, [loading, chans, movies, series])

  return (
    <FocusContext.Provider value={rootKey}><div ref={rootRef} style={{ height: '100%', overflowY: 'auto', padding: '32px 48px', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 40, fontWeight: 850, marginBottom: 28 }}>{t('nav.favorites')}</h1>
      {loading && <p style={{ color: 'var(--text-dim)', fontSize: 20 }}>{t('common.loading')}</p>}
      {isEmpty && (
        <p style={{ color: 'var(--text-dim)', fontSize: 22 }}>
          {t('favorites.empty')}
        </p>
      )}
      {!loading && (
        <>
          <Section
            title={t('common.channels')}
            focusPrefix="channels"
            items={chans.map((c) => ({ id: c.id, name: c.name, poster: c.logo }))}
            onSelect={(id) => { const c = chans.find((x) => x.id === id); if (c) startPlayback(c, '') }}
          />
          <Section
            title={t('common.movies')}
            focusPrefix="movies"
            items={movies}
            onSelect={(id) => { const m = movies.find((x) => x.id === id); if (m) openMovie(m) }}
          />
          <Section
            title={t('common.series')}
            focusPrefix="series"
            items={series}
            onSelect={(id) => { const s = series.find((x) => x.id === id); if (s) openSeries(s) }}
          />
        </>
      )}
    </div></FocusContext.Provider>
  )
}
