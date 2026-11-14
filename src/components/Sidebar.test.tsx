import { describe, it, expect, beforeAll } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../navigation/spatial'
import { APP_VERSION } from '../version'
import { Sidebar } from './Sidebar'

beforeAll(() => initSpatialNavigation())

describe('Sidebar', () => {
  it('affiche tous les items de navigation', () => {
    render(<Sidebar />)
    for (const label of ['Direct', 'Films', 'Séries', 'Favoris', 'Recherche', 'Réglages']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
    expect(screen.getByText('Donate')).toBeTruthy()
    expect(screen.getByText(`Version ${APP_VERSION}`)).toBeTruthy()
  })

  it('ouvre la pop-up Donate', () => {
    render(<Sidebar />)
    fireEvent.click(screen.getByRole('button', { name: 'Donate' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('nowave.io/vizion/donate')).toBeTruthy()
  })
})
