import { useState, useEffect, useRef } from 'preact/hooks'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import type { Channel, Movie, Series } from '../../data/models'
import { focusIfExists } from '../../navigation/focus'
import { rememberedFocus } from '../../router/router'
import { startPlayback } from '../live/playback'
import { openMovie } from '../vod/vod-nav'
import { openSeries } from '../series/series-nav'
import { PosterTile } from '../media/PosterTile'
import { OnScreenKeyboard } from './OnScreenKeyboard'
import { searchAll, type SearchResults } from './search'
import { SEARCH_FIRST_KEY } from './search-focus-keys'
import { ActionButton } from '../../components/ActionButton'
import { t } from '../../i18n'

// ── Constantes de style ───────────────────────────────────────────────────────

/** Largeur de la colonne clavier (px) — ajustée pour 7 touches × (64 + 8) − 8. */
const KBD_COL_W = 7 * 64 + 6 * 8 // = 496

// ── Sous-composants ───────────────────────────────────────────────────────────

/** Affichage de la requête courante au-dessus du clavier. */
function QueryDisplay({ query }: { query: string }) {
  return (
    <div
      style={{
        minHeight: 72,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        marginBottom: 20,
        background: 'var(--surface)',
        borderRadius: 12,
        boxShadow: '0 0 0 1px var(--glass-border)',
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: query ? 'var(--text)' : 'var(--text-dim)',
          letterSpacing: 1,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {query || t('search.placeholder')}
      </span>
      {/* Curseur clignotant */}
      <span
        style={{
          display: 'inline-block',
          width: 3,
          height: 36,
          background: 'var(--accent)',
          marginLeft: 4,
          borderRadius: 2,
          animation: 'blink 1s step-start infinite',
        }}
      />
    </div>
  )
}

/** Section de résultats (titre + rangée horizontale de PosterTiles). */
function ResultSection({
  title,
  children,
}: {
  title: string
  children: preact.ComponentChildren
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-dim)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 16,
          overflowX: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Message centré pour les états vides / chargement / indication. */
function HintMessage({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-dim)',
        fontSize: 24,
      }}
    >
      {text}
    </div>
  )
}

// ── Panneau de résultats ──────────────────────────────────────────────────────

interface ResultsPanelProps {
  query: string
  loading: boolean
  results: SearchResults | null
}

function ResultsPanel({ query, loading, results }: ResultsPanelProps) {
  // Invite initiale : pas encore assez de caractères.
  if (query.length < 2) {
    return <HintMessage text={t('search.typeToSearch')} />
  }

  if (loading && !results) {
    return <HintMessage text={t('search.searching')} />
  }

  if (!results) {
    return <HintMessage text={t('search.typeToSearch')} />
  }

  const { channels, movies, series } = results
  const isEmpty = channels.length === 0 && movies.length === 0 && series.length === 0

  if (isEmpty) {
    return <HintMessage text={t('common.noResults')} />
  }

  return (
    <div>
      {channels.length > 0 && (
        <ResultSection title={t('common.channels')}>
          {channels.map((c: Channel) => (
            <PosterTile
              key={c.id}
              focusKey={`sr-ch-${c.id}`}
              item={{ id: c.id, name: c.name, poster: c.logo }}
              onSelect={() => startPlayback(c, '')}
            />
          ))}
        </ResultSection>
      )}

      {movies.length > 0 && (
        <ResultSection title={t('common.movies')}>
          {movies.map((m: Movie) => (
            <PosterTile
              key={m.id}
              focusKey={`sr-mv-${m.id}`}
              item={m}
              onSelect={() => openMovie(m)}
            />
          ))}
        </ResultSection>
      )}

      {series.length > 0 && (
        <ResultSection title={t('common.series')}>
          {series.map((s: Series) => (
            <PosterTile
              key={s.id}
              focusKey={`sr-sr-${s.id}`}
              item={s}
              onSelect={() => openSeries(s)}
            />
          ))}
        </ResultSection>
      )}
    </div>
  )
}

// ── SearchScreen ──────────────────────────────────────────────────────────────

/** Dernière requête de la session : retrouvée au retour d'un résultat (Back). */
let lastQuery = ''

/** Écran de recherche : clavier virtuel à gauche, résultats groupés à droite. */
export function SearchScreen() {
  const [query, setQuery] = useState(lastQuery)
  // Résultat ouvert avant de quitter l'écran : refocalisé dès qu'il réapparaît.
  const backTo = useRef(rememberedFocus())
  const [error, setError] = useState(false)
  const [attempt, retry] = useState(0)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  // Garde « vivante » : empêche les mises à jour d'état après démontage du composant.
  const aliveRef = useRef(true)
  // Requête courante : permet d'ignorer un résultat périmé qui arrive après une nouvelle frappe.
  const queryRef = useRef(query)
  const generationRef = useRef(0)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  // Debounce de 300 ms sur la requête : évite de surcharger l'API à chaque frappe.
  useEffect(() => {
    const generation = ++generationRef.current
    queryRef.current = query
    // Nouvelle frappe : on abandonne la restauration du focus sur l'ancien résultat.
    if (query !== lastQuery) backTo.current = undefined
    lastQuery = query
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      setResults(null)
      setError(false)
      const stale = () => !aliveRef.current || queryRef.current !== query || generation !== generationRef.current
      searchAll(query, 30, r => { if (!stale()) setResults(r) }, () => { if (!stale()) setError(true) })
        .then((r) => {
          if (stale()) return
          setResults(r)
          setLoading(false)
        })
        .catch(() => {
          if (stale()) return
          setResults({ channels: [], movies: [], series: [] })
          setLoading(false)
        })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, attempt])

  // Saisie clavier physique (utile en navigateur/dev) en plus du clavier TV à l'écran.
  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }

    function consume(event: KeyboardEvent) {
      event.preventDefault()
      event.stopPropagation()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === 'Backspace') {
        // Requête vide : Backspace redevient « Retour » (navigateur/clavier USB).
        if (!queryRef.current) return
        consume(event)
        setQuery((current) => current.slice(0, -1))
        return
      }

      if (event.key.length === 1) {
        consume(event)
        setQuery((current) => current + event.key.toLowerCase())
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  // Retour depuis un résultat : refocalise la tuile ouverte dès que les résultats la contiennent.
  useEffect(() => {
    if (focusIfExists(backTo.current)) backTo.current = undefined
  }, [results])

  // Focus initial : première touche du clavier dès le montage de l'écran.
  useEffect(() => {
    const timer = setTimeout(() => setFocus(SEARCH_FIRST_KEY), 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        padding: '40px 48px',
        gap: 48,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Colonne gauche : champ de saisie + clavier virtuel ─────────────── */}
      <div
        style={{
          width: KBD_COL_W,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <QueryDisplay query={query} />
        <OnScreenKeyboard
          value={query}
          onChange={setQuery}
          onMoveLeft={() => focusIfExists('nav-/recherche')}
        />
      </div>

      {/* ── Colonne droite : résultats groupés ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 8,
        }}
      >
        {error && <div role="alert"><p>{t('common.loadError')}</p><ActionButton onPress={() => retry(n => n + 1)}>{t('common.retry')}</ActionButton></div>}
        {loading && results && <p role="status">{t('search.searching')}</p>}
        <ResultsPanel query={query} loading={loading} results={results} />
      </div>
    </div>
  )
}
