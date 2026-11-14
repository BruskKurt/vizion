import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/preact'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { initSpatialNavigation, useFocusable } from './spatial'
import { settingsStore } from '../profiles/settings'

beforeAll(() => initSpatialNavigation())
afterEach(() => { settingsStore.language.value = 'fr' })

function Probe({ seen }: { seen: string[] }) {
  const { ref } = useFocusable({ focusKey: 'rtl-probe', onArrowPress: (direction) => { seen.push(direction); return false } })
  return <div ref={ref} />
}

const pressRight = () => window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 39 }))

describe('navigation RTL', () => {
  it('met le document en miroir et donne la direction logique aux gestionnaires', () => {
    const seen: string[] = []
    render(<Probe seen={seen} />)
    setFocus('rtl-probe')

    settingsStore.language.value = 'ar'
    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('ar')
    pressRight()

    settingsStore.language.value = 'fr'
    expect(document.documentElement.dir).toBe('ltr')
    pressRight()

    expect(seen).toEqual(['left', 'right'])
  })
})
