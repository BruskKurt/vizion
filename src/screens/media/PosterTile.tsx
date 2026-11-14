import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

// Dimensions TV de la tuile poster (ratio 2:3).
const POSTER_W = 190

/** Élément minimal requis pour afficher une tuile poster. */
export interface PosterItem {
  id: string
  name: string
  poster?: string
}

interface Props {
  focusKey: string
  item: PosterItem
  onFocus?: () => void
  onSelect: () => void
  onArrowPress?: (direction: string) => boolean
}

/** Tuile générique affichant le poster d'un élément (film ou série, ratio 2:3) avec anneau de focus. */
export function PosterTile({ focusKey, item, onSelect, onArrowPress, onFocus }: Props) {
  const { ref, focused } = useFocusable({
    focusKey,
    onFocus,
    onEnterPress: onSelect,
    onArrowPress,
  })

  useFocusScroll(ref, focused, 'center')

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={-1}
      aria-label={item.name}
      data-focused={focused}
      data-focus-key={focusKey}
      onClick={onSelect}
      style={{
        flexShrink: 0,
        width: POSTER_W,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {/* Poster 2:3 */}
      <div
        style={{
          width: POSTER_W,
          aspectRatio: '2/3',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: focused ? 'var(--focus-glow)' : '0 0 0 0px transparent',
          transition: 'box-shadow var(--dur) var(--ease), background var(--dur) var(--ease)',
        }}
      >
        {item.poster ? (
          <img
            loading="lazy"
            decoding="async"
            src={item.poster}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          // Repli textuel si pas de poster.
          <span
            style={{
              color: 'var(--text-dim)',
              fontSize: 16,
              textAlign: 'center',
              padding: '0 8px',
              wordBreak: 'break-word',
            }}
          >
            {item.name}
          </span>
        )}
      </div>

      {/* Libellé sous le poster — 1 ligne avec ellipsis. */}
      <span
        style={{
          fontSize: 16,
          fontWeight: focused ? 700 : 500,
          color: focused ? 'var(--text)' : 'var(--text-dim)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'color var(--dur) var(--ease)',
        }}
      >
        {item.name}
      </span>
    </div>
  )
}
