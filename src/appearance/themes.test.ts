import { applyAppearance, mix } from './themes'

describe('themes', () => {
  it('mélange deux couleurs', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#102030', '#ffffff', 0)).toBe('#102030')
  })

  it('teinte texte, filets et focus selon le thème et l’accent', () => {
    const root = document.createElement('div')
    applyAppearance(root, 'warm', 'gold')
    expect(root.style.getPropertyValue('--text')).toBe('#fbf0e4')
    expect(root.style.getPropertyValue('--glass-border')).toBe('#fbf0e424')
    expect(root.style.getPropertyValue('--focus-bg')).toBe(mix('#362a21', '#f5ce78', 0.22))
  })
})
