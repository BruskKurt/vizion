import { useFocusScroll } from '../navigation/use-focus-scroll'
import { useLayoutEffect } from 'preact/hooks'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ComponentChildren } from 'preact'

export function ActionButton({ children, onPress, focusKey, disabled = false }: {
  children: ComponentChildren; onPress: () => void; focusKey?: string; disabled?: boolean
}) {
  const { ref, focused, focusSelf } = useFocusable({ focusKey, onEnterPress: () => { if (!disabled) onPress() } })
  useLayoutEffect(() => { if (focused) ref.current?.focus({ preventScroll: true }) }, [focused])
  useFocusScroll(ref, focused)
  return <button ref={ref} type="button" data-focused={focused} data-focus-key={focusKey} aria-disabled={disabled} onClick={() => { focusSelf(); if (!disabled) onPress() }}
    className={`action-button ${focused ? 'is-focused' : ''}`}>{children}</button>
}
