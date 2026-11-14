import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { SEARCH_KEYBOARD } from './search-focus-keys'
import { t } from '../../i18n'

// ── Disposition des touches ───────────────────────────────────────────────────

/**
 * Rangées du clavier virtuel :
 * - 4 rangées alphabétiques (7 lettres chacune)
 * - 1 rangée chiffres (10 touches)
 * - 1 rangée d'actions (Espace, ⌫, Effacer)
 */
export const KEY_ROWS: string[][] = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  ['space', '⌫', 'clear'],
]

// ── Dimensions ────────────────────────────────────────────────────────────────

/** Largeur d'une touche standard (px). */
const KEY_W = 64
/** Hauteur d'une touche (px). */
const KEY_H = 64
/** Écart entre les touches (px). */
const KEY_GAP = 8

// ── Touche individuelle ───────────────────────────────────────────────────────

interface KeyCellProps {
  label: string
  /** Première touche de sa rangée — reçoit la gestion de la flèche gauche. */
  isFirst: boolean
  /** Callback déclenché à l'appui sur Entrée / OK. */
  onActivate: (label: string) => void
  /** Callback pour fuir vers la colonne de résultats (flèche gauche sur 1re touche). */
  onMoveLeft?: () => boolean
}

/** Touche unitaire focusable du clavier virtuel. */
function KeyCell({ label, isFirst, onActivate, onMoveLeft }: KeyCellProps) {
  const displayLabel = label === 'space' ? t('keyboard.space') : label === 'clear' ? t('keyboard.clear') : label
  const { ref, focused } = useFocusable({
    focusKey: `key-${label}`,
    onEnterPress: () => onActivate(label),
    onArrowPress: (direction: string) => {
      // Flèche gauche sur la première touche d'une rangée → tenter d'échapper vers le rail
      if (direction === 'left' && isFirst && onMoveLeft) {
        const handled = onMoveLeft()
        // Retourner false si la navigation externe a réussi (pour ne pas bouger dans le clavier)
        return !handled
      }
      return true
    },
  })

  // Largeur étendue pour les touches d'action (Espace, Effacer)
  const isWide = label === 'space' || label === 'clear'
  const width = isWide ? KEY_W * 2 + KEY_GAP : KEY_W

  return (
    <div
      ref={ref}
      style={{
        width,
        height: KEY_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        flexShrink: 0,
        cursor: 'pointer',
        fontSize: displayLabel.length > 1 ? 14 : 20,
        fontWeight: 700,
        transition: 'background var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        boxShadow: focused ? 'var(--focus-glow)' : '0 0 0 1px var(--glass-border)',
        color: focused ? '#fff' : 'var(--text)',
        userSelect: 'none',
      }}
    >
      {displayLabel}
    </div>
  )
}

// ── Props du composant ────────────────────────────────────────────────────────

interface Props {
  /** Valeur courante du champ de saisie. */
  value: string
  /** Appelé à chaque modification de valeur. */
  onChange: (v: string) => void
  /**
   * Appelé quand l'utilisateur appuie ← sur la première touche d'une rangée.
   * Renvoie true si le focus a été déplacé vers l'extérieur (le clavier ne bouge plus).
   */
  onMoveLeft?: () => boolean
}

// ── Composant principal ───────────────────────────────────────────────────────

/** Clavier virtuel TV : lettres A–Z, chiffres 0–9 et actions (Espace, ⌫, Effacer). */
export function OnScreenKeyboard({ value, onChange, onMoveLeft }: Props) {
  const { ref, focusKey } = useFocusable({
    focusKey: SEARCH_KEYBOARD,
    saveLastFocusedChild: true,
    trackChildren: true,
    isFocusBoundary: false,
  })

  /** Applique la touche pressée à la valeur courante. */
  function handleActivate(label: string) {
    if (label === '⌫') {
      // Supprime le dernier caractère
      onChange(value.slice(0, -1))
    } else if (label === 'clear') {
      // Vide totalement la saisie
      onChange('')
    } else if (label === 'space') {
      onChange(value + ' ')
    } else {
      // Lettre ou chiffre : ajouter en minuscule pour un rendu naturel
      onChange(value + label.toLowerCase())
    }
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: KEY_GAP,
        }}
      >
        {KEY_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{ display: 'flex', flexDirection: 'row', gap: KEY_GAP }}
          >
            {row.map((label, colIndex) => (
              <KeyCell
                key={label}
                label={label}
                isFirst={colIndex === 0}
                onActivate={handleActivate}
                onMoveLeft={onMoveLeft}
              />
            ))}
          </div>
        ))}
      </div>
    </FocusContext.Provider>
  )
}
