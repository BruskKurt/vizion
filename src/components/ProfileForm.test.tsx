import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../navigation/spatial'
import { ProfileForm } from './ProfileForm'

beforeAll(() => initSpatialNavigation())

describe('ProfileForm', () => {
  it('affiche les champs Xtream par défaut', () => {
    render(<ProfileForm onDone={() => {}} />)
    expect(screen.getByPlaceholderText('Nom du profil')).toBeTruthy()
    expect(screen.getByPlaceholderText('Hôte (http://…:8080)')).toBeTruthy()
    expect(screen.getByPlaceholderText('Utilisateur')).toBeTruthy()
    expect(screen.getByPlaceholderText('Mot de passe')).toBeTruthy()
    expect(screen.getByText('Xtream')).toBeTruthy()
    expect(screen.getByText('M3U')).toBeTruthy()
  })
})
