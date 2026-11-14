import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useCallback, useEffect, useRef } from 'preact/hooks'
import { memo } from 'preact/compat'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useFocusable } from '../../navigation/spatial'
import type { Category } from '../../data/models'
import { focusIfExists } from '../../navigation/focus'
import { t } from '../../i18n'
import {
  categoryEditFocusKey,
  categoryFocusKey,
  CATEGORY_EDIT,
  CATEGORY_EDIT_DONE,
  CATEGORY_EDIT_RESET,
  LIVE_CATEGORIES,
} from './focus-keys'

interface Props {
  categories: Category[]
  playlistCategories: Category[]
  selectedId: string
  hiddenCategoryIds: string[]
  editing: boolean
  onSelect: (id: string) => void
  onMoveRight: () => boolean
  onStartEdit: () => void
  onStopEdit: () => void
  onToggleCategory: (id: string) => void
  onResetVisibility: () => void
}

// memo + callbacks stables : un focus de chaîne ne re-rend plus toute la colonne.
const Item = memo(function Item(props: {
  id: string
  index: number
  label: string
  selected: boolean
  onSelect: (id: string) => void
  onMoveRight: () => boolean
  onStep: (index: number, delta: number) => boolean
}) {
  const select = () => props.onSelect(props.id)
  const { ref, focused } = useFocusable({
    focusKey: categoryFocusKey(props.id),
    // Chargement sur OK uniquement (pas au survol) → navigation plus fluide, moins de requêtes.
    onEnterPress: select,
    onArrowPress: (direction) => {
      // Haut/bas par index : évite que Norigin mesure toutes les catégories à chaque appui.
      if (direction === 'up' || direction === 'down') return !props.onStep(props.index, direction === 'down' ? 1 : -1)
      if (direction === 'right' && props.onMoveRight()) return false
      if (direction === 'left' && focusIfExists('nav-/direct')) return false
      return true
    },
  })
  useFocusScroll(ref, focused)
  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={select}
      style={{
        display: 'flex', alignItems: 'center', padding: '16px 18px', minHeight: 58, borderRadius: 10, fontSize: 20, fontWeight: props.selected ? 800 : 600,
        color: focused || props.selected ? 'var(--text)' : 'var(--text-dim)',
        background: focused ? 'var(--focus-bg)' : props.selected ? 'var(--active-bg)' : 'transparent',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.label}</span>
    </div>
  )
})

function ControlButton(props: { focusKey: string; label: string; onPress: () => void; onMoveRight?: () => boolean }) {
  const { ref, focused } = useFocusable({
    focusKey: props.focusKey,
    onEnterPress: props.onPress,
    onArrowPress: (direction) => {
      if (direction === 'left' && focusIfExists('nav-/direct')) return false
      if (direction === 'right' && props.onMoveRight?.()) return false
      return true
    },
  })
  useFocusScroll(ref, focused)
  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={props.onPress}
      style={{
        flex: 1,
        minHeight: 48,
        padding: '12px 14px',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 800,
        color: focused ? 'var(--text)' : 'var(--text-dim)',
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.label}</span>
    </div>
  )
}

function EditItem(props: { id: string; label: string; hidden: boolean; onToggle: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: categoryEditFocusKey(props.id),
    onEnterPress: props.onToggle,
    onArrowPress: (direction) => {
      if (direction === 'left' && focusIfExists('nav-/direct')) return false
      return true
    },
  })
  useFocusScroll(ref, focused)
  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={props.onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 14px',
        minHeight: 58,
        borderRadius: 10,
        fontSize: 18,
        fontWeight: 700,
        color: props.hidden ? 'var(--text-faint)' : 'var(--text)',
        background: focused ? 'var(--focus-bg)' : 'transparent',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 24, flexShrink: 0, textAlign: 'center' }}>{props.hidden ? '○' : '✓'}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.label}</span>
      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: props.hidden ? 'var(--text-faint)' : 'var(--accent)' }}>
        {props.hidden ? t('common.hidden') : t('common.visible')}
      </span>
    </div>
  )
}

export function CategoryList({
  categories,
  playlistCategories,
  selectedId,
  hiddenCategoryIds,
  editing,
  onSelect,
  onMoveRight,
  onStartEdit,
  onStopEdit,
  onToggleCategory,
  onResetVisibility,
}: Props) {
  const { ref, focusKey } = useFocusable({
    focusKey: LIVE_CATEGORIES,
    preferredChildFocusKey: editing ? CATEGORY_EDIT_DONE : categoryFocusKey(selectedId),
    saveLastFocusedChild: true,
    trackChildren: true,
  })
  const previousEditing = useRef(editing)

  useEffect(() => {
    if (previousEditing.current === editing) return
    previousEditing.current = editing
    const id = setTimeout(() => {
      if (editing) {
        focusIfExists(CATEGORY_EDIT_DONE)
      } else {
        focusIfExists(categoryFocusKey(selectedId)) || focusIfExists(CATEGORY_EDIT)
      }
    }, 0)
    return () => clearTimeout(id)
  }, [editing, selectedId])

  const onStep = useCallback((index: number, delta: number) => {
    const next = categories[index + delta]
    return !!next && focusIfExists(categoryFocusKey(next.id))
  }, [categories])

  const hiddenSet = new Set(hiddenCategoryIds)
  const hiddenCount = hiddenCategoryIds.length
  const hiddenCountLabel = t(hiddenCount > 1 ? 'live.hiddenCount.many' : 'live.hiddenCount.one', { count: hiddenCount })

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="divider-end"
        style={{
          width: 'var(--live-category-width)',
          padding: '28px 14px',
          height: '100%',
          overflowY: 'auto',
          // Fond opaque : permet au navigateur de défiler sur une couche GPU sans repeindre la liste.
          background: 'var(--bg)',
        }}
      >
        {editing ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <ControlButton focusKey={CATEGORY_EDIT_DONE} label={t('live.done')} onPress={onStopEdit} />
              <ControlButton focusKey={CATEGORY_EDIT_RESET} label={t('live.reset')} onPress={onResetVisibility} />
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 700, padding: '0 4px 10px' }}>
              {hiddenCount === 0 ? t('live.allVisible') : hiddenCountLabel}
            </div>
            {playlistCategories.map((c) => (
              <EditItem
                key={c.id}
                id={c.id}
                label={c.name}
                hidden={hiddenSet.has(c.id)}
                onToggle={() => onToggleCategory(c.id)}
              />
            ))}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <ControlButton focusKey={CATEGORY_EDIT} label={t('common.edit')} onPress={onStartEdit} onMoveRight={onMoveRight} />
            </div>
            {hiddenCount > 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 700, padding: '0 4px 10px' }}>
                {hiddenCountLabel}
              </div>
            )}
            {categories.map((c, index) => (
              <Item
                key={c.id}
                id={c.id}
                index={index}
                label={c.name}
                selected={c.id === selectedId}
                onSelect={onSelect}
                onMoveRight={onMoveRight}
                onStep={onStep}
              />
            ))}
          </>
        )}
      </div>
    </FocusContext.Provider>
  )
}
