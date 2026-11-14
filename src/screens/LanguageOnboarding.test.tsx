import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { initSpatialNavigation } from '../navigation/spatial'
import { settingsStore } from '../profiles/settings'
import { LanguageOnboarding } from './LanguageOnboarding'

beforeAll(() => initSpatialNavigation())

beforeEach(() => {
  localStorage.clear()
  settingsStore.language.value = 'fr'
  settingsStore.languageSelected.value = false
})

describe('LanguageOnboarding', () => {
  it('permet de choisir anglais au premier lancement', () => {
    render(<LanguageOnboarding />)

    expect(screen.getAllByText('Choisir la langue')).toHaveLength(2)
    fireEvent.click(screen.getByText('English'))

    expect(settingsStore.language.value).toBe('en')
    expect(settingsStore.languageSelected.value).toBe(true)
  })
})
