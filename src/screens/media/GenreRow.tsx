import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useFocusable, FocusContext, getCurrentFocusKey } from '@noriginmedia/norigin-spatial-navigation'
import type { Category } from '../../data/models'
import { focusIfExists } from '../../navigation/focus'
import { seeMoreKey, genreRowKey, posterItemKey } from './media-focus-keys'
import { PosterTile, type PosterItem } from './PosterTile'
import { ActionButton } from '../../components/ActionButton'
import { t } from '../../i18n'

// Nombre maximum de tuiles affichées dans une rangée (avant « Voir + »).
const MAX_TILES = 15

interface Props {
  /** Catégorie à afficher (nom + id). */
  category: Category
  /** Chargeur de contenu — injecté par le parent (VOD ou Séries). */
  load: (catId: string) => Promise<PosterItem[]>
  /** Appelé quand l'utilisateur sélectionne un élément. */
  onOpen: (item: PosterItem) => void
  /** Appelé quand l'utilisateur choisit « Voir + ». */
  onSeeMore: (catId: string) => void
  /** Clé de focus du rail de navigation latéral (pour la flèche gauche). */
  onReady?: () => void
  navRailKey?: string
}

/** Rangée horizontale lazy d'un genre (films ou séries). Charge le contenu au premier passage visible. */
export function GenreRow({ category, load, onOpen, onSeeMore, navRailKey, onReady }: Props) {
  const [items, setItems] = useState<PosterItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { if (!loading) onReady?.() }, [loading])
  // Garantit que le chargement n'est déclenché qu'une seule fois.
  const loadedRef = useRef(false)
  // Réf sur le wrapper externe (cible de l'IntersectionObserver).
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  function loadItems() {
    if (loadedRef.current) return
    loadedRef.current = true
    setError(false); setLoading(true)
    load(category.id).then((all) => {
      if (!alive.current) return
      setItems(all.slice(0, MAX_TILES))
      setTotal(all.length)
      setLoading(false)
    }).catch(() => { if (alive.current) { loadedRef.current = false; setError(true); setLoading(false) } })
  }

  useEffect(() => {
    // Chargement paresseux via IntersectionObserver si disponible.
    if (typeof IntersectionObserver === 'undefined') {
      loadItems()
      return
    }
    const el = sentinelRef.current
    if (!el) { loadItems(); return }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          loadItems()
        }
      },
      { threshold: 0.1, rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [])

  // Conteneur focusable horizontal (FocusContext pour les PosterTiles enfants).
  const { ref: focusRef, focusKey } = useFocusable({
    focusKey: genreRowKey(category.id),
    saveLastFocusedChild: true,
    trackChildren: true,
    onFocus: () => { loadItems(); sentinelRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' }) },
  })

  useEffect(() => {
    if (!loading && items[0] && getCurrentFocusKey() === focusKey) {
      focusIfExists(posterItemKey(items[0].id, `${navRailKey}:${category.id}`))
    }
  }, [loading, items, focusKey])

  return (
    // Wrapper externe : observé par l'IntersectionObserver.
    // minHeight réserve la place AVANT chargement → seules les rangées réellement
    // à l'écran déclenchent un fetch (chargement échelonné, pas tout en même temps).
    <div ref={el => { sentinelRef.current = el; focusRef.current = el }} style={{ marginBottom: 40, minHeight: 360 }}>
      {/* Titre de la catégorie */}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 14px 0',
          paddingLeft: 4,
        }}
      >
        {category.name}
      </h2>

      {loading && (
        <p style={{ color: 'var(--text-dim)', fontSize: 18, padding: '12px 0' }}>{t('common.loading')}</p>
      )}

      {error && <div role="alert"><p>{t('common.loadError')}</p><ActionButton onPress={loadItems}>{t('common.retry')}</ActionButton></div>}
      {!loading && !error && (
        <FocusContext.Provider value={focusKey}>
          {/* Conteneur focusable horizontal (ref de useFocusable) — défilement masqué. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              overflowX: 'hidden',
            }}
          >
            {items.map((it, idx) => (
              <PosterTile
                key={it.id}
                focusKey={posterItemKey(it.id, `${navRailKey}:${category.id}`)}
                item={it}
                onSelect={() => onOpen(it)}
                onArrowPress={(direction) => {
                  // Flèche gauche sur la première tuile → retour au rail de navigation.
                  if (direction === 'left' && idx === 0 && navRailKey) {
                    return !focusIfExists(navRailKey)
                  }
                  return true
                }}
              />
            ))}

            {/* Tuile « Voir + » si la catégorie contient plus de MAX_TILES éléments. */}
            {total > MAX_TILES && (
              <SeeMoreTile
                catId={category.id}
                onSelect={() => onSeeMore(category.id)}
              />
            )}
          </div>
        </FocusContext.Provider>
      )}
    </div>
  )
}

// ── Tuile « Voir + » ────────────────────────────────────────────────────────

interface SeeMoreProps {
  catId: string
  onSelect: () => void
}

function SeeMoreTile({ catId, onSelect }: SeeMoreProps) {
  const { ref, focused } = useFocusable({
    focusKey: seeMoreKey(catId),
    onEnterPress: onSelect,
  })

  useFocusScroll(ref, focused, 'center')

  // Même largeur que PosterTile (190 px) pour s'aligner dans la rangée.
  const POSTER_W = 190

  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={onSelect}
      style={{
        flexShrink: 0,
        width: POSTER_W,
        aspectRatio: '2/3',
        borderRadius: 10,
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
      }}
    >
      <span
        style={{
          color: 'var(--text)',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {t('common.seeMore')}
      </span>
    </div>
  )
}
