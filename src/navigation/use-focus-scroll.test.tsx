import { render } from '@testing-library/preact'
import { useRef, useLayoutEffect } from 'preact/hooks'
import { expect, it, vi } from 'vitest'
import { useFocusScroll } from './use-focus-scroll'

it('reveals the current focus before the parent layout/paint, including virtual-window rerenders', () => {
  const scroll = vi.fn()
  const original = Element.prototype.scrollIntoView
  Element.prototype.scrollIntoView = scroll
  const callsAtLayout: number[] = []
  function Item({ focused }: { focused: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    useFocusScroll(ref, focused)
    return <div ref={ref}>Item</div>
  }
  function List({ focused, windowStart }: { focused: boolean; windowStart: number }) {
    useLayoutEffect(() => { callsAtLayout.push(scroll.mock.calls.length) })
    return <div><div style={{ height: windowStart * 72 }} /><Item focused={focused} /></div>
  }
  try {
    const { rerender } = render(<List focused={false} windowStart={0} />)
    expect(callsAtLayout[callsAtLayout.length - 1]).toBe(0)
    rerender(<List focused windowStart={0} />)
    expect(callsAtLayout[callsAtLayout.length - 1]).toBe(1)
    rerender(<List focused windowStart={30} />)
    expect(callsAtLayout[callsAtLayout.length - 1]).toBe(2)
    expect(scroll).toHaveBeenLastCalledWith({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
    rerender(<List focused={false} windowStart={31} />)
    expect(scroll).toHaveBeenCalledTimes(2)
  } finally { Element.prototype.scrollIntoView = original }
})
