import { describe, it, expect } from 'vitest'
import { mapKeyCode } from './keys'

describe('mapKeyCode', () => {
  it('Back webOS (461) + Backspace (8) + Escape (27) -> back', () => {
    expect(mapKeyCode(461)).toEqual({ type: 'back' })
    expect(mapKeyCode(8)).toEqual({ type: 'back' })
    expect(mapKeyCode(27)).toEqual({ type: 'back' })
  })

  it('touches média webOS', () => {
    expect(mapKeyCode(415)).toEqual({ type: 'play' })
    expect(mapKeyCode(19)).toEqual({ type: 'pause' })
    expect(mapKeyCode(413)).toEqual({ type: 'stop' })
    expect(mapKeyCode(417)).toEqual({ type: 'fastforward' })
    expect(mapKeyCode(412)).toEqual({ type: 'rewind' })
  })

  it('chiffres : rangée principale et pavé numérique', () => {
    expect(mapKeyCode(48)).toEqual({ type: 'digit', value: 0 })
    expect(mapKeyCode(57)).toEqual({ type: 'digit', value: 9 })
    expect(mapKeyCode(96)).toEqual({ type: 'digit', value: 0 })
    expect(mapKeyCode(105)).toEqual({ type: 'digit', value: 9 })
  })

  it('touches inconnues / gérées par Norigin (flèches, OK) -> null', () => {
    expect(mapKeyCode(37)).toBeNull() // flèche gauche : Norigin
    expect(mapKeyCode(13)).toBeNull() // OK : Norigin
    expect(mapKeyCode(999)).toBeNull()
  })
})
