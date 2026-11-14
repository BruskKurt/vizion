import { describe, it, expect, beforeAll, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../../navigation/spatial'
import { CategoryList } from './CategoryList'
import { FAV_ID } from './playback'
import type { Category } from '../../data/models'

beforeAll(() => initSpatialNavigation())

const playlistCategories: Category[] = [
  { id: 'news', name: 'Infos', kind: 'live' },
  { id: 'sport', name: 'Sport', kind: 'live' },
]

const visibleCategories: Category[] = [
  { id: FAV_ID, name: 'Favoris', kind: 'live' },
  playlistCategories[0],
]

function renderCategoryList(overrides: Partial<Parameters<typeof CategoryList>[0]> = {}) {
  const props: Parameters<typeof CategoryList>[0] = {
    categories: visibleCategories,
    playlistCategories,
    selectedId: 'news',
    hiddenCategoryIds: ['sport'],
    editing: false,
    onSelect: vi.fn(),
    onMoveRight: vi.fn(() => false),
    onStartEdit: vi.fn(),
    onStopEdit: vi.fn(),
    onToggleCategory: vi.fn(),
    onResetVisibility: vi.fn(),
    ...overrides,
  }
  render(<CategoryList {...props} />)
  return props
}

describe('CategoryList', () => {
  it('affiche les catégories visibles et le raccourci édition', () => {
    const props = renderCategoryList()
    expect(screen.getByText('Modifier')).toBeTruthy()
    expect(screen.getByText('Favoris')).toBeTruthy()
    expect(screen.getByText('Infos')).toBeTruthy()
    expect(screen.queryByText('Sport')).toBeNull()

    fireEvent.click(screen.getByText('Modifier'))
    expect(props.onStartEdit).toHaveBeenCalled()
  })

  it('affiche toutes les catégories playlist en mode édition', () => {
    const props = renderCategoryList({ editing: true })
    expect(screen.getByText('Terminer')).toBeTruthy()
    expect(screen.getByText('Réinitialiser')).toBeTruthy()
    expect(screen.getByText('Infos')).toBeTruthy()
    expect(screen.getByText('Sport')).toBeTruthy()
    expect(screen.getByText('Masquée')).toBeTruthy()

    fireEvent.click(screen.getByText('Sport'))
    expect(props.onToggleCategory).toHaveBeenCalledWith('sport')
    fireEvent.click(screen.getByText('Réinitialiser'))
    expect(props.onResetVisibility).toHaveBeenCalled()
  })
})
