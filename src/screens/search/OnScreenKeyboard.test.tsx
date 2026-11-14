import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../../navigation/spatial'
import { OnScreenKeyboard } from './OnScreenKeyboard'

// Initialise la navigation spatiale avant tous les tests (obligatoire pour useFocusable).
beforeAll(() => initSpatialNavigation())

describe('OnScreenKeyboard', () => {
  it('affiche les lettres A et Z', () => {
    render(<OnScreenKeyboard value="" onChange={() => {}} />)
    // La lettre A doit être présente (première touche)
    expect(screen.getByText('A')).toBeTruthy()
    // La lettre Z doit être présente (dernière rangée alphabétique)
    expect(screen.getByText('Z')).toBeTruthy()
  })

  it('affiche la touche retour arrière ⌫', () => {
    render(<OnScreenKeyboard value="" onChange={() => {}} />)
    expect(screen.getByText('⌫')).toBeTruthy()
  })

  it('affiche la touche Espace', () => {
    render(<OnScreenKeyboard value="" onChange={() => {}} />)
    expect(screen.getByText('Espace')).toBeTruthy()
  })

  it('affiche la touche Effacer', () => {
    render(<OnScreenKeyboard value="" onChange={() => {}} />)
    expect(screen.getByText('Effacer')).toBeTruthy()
  })

  it('affiche les chiffres 0 et 9', () => {
    render(<OnScreenKeyboard value="" onChange={() => {}} />)
    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText('9')).toBeTruthy()
  })
})
