import { fireEvent, render, screen } from '@testing-library/preact'
import { expect, it, vi } from 'vitest'
import { useRemote } from './useRemote'
it('leaves text editing keys to inputs while keeping the TV Back button active', () => {
  const handler = vi.fn()
  function Form() { useRemote(handler); return <input aria-label="Search" /> }
  render(<Form />)
  const input = screen.getByRole('textbox')
  fireEvent.keyDown(input, { key:'Backspace', keyCode:8 })
  fireEvent.keyDown(input, { key:'1', keyCode:49 })
  expect(handler).not.toHaveBeenCalled()
  fireEvent.keyDown(input, { keyCode:461 })
  expect(handler).toHaveBeenCalledWith({ type:'back' })
})
