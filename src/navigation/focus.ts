import { doesFocusableExist, setFocus } from '@noriginmedia/norigin-spatial-navigation'

export function focusIfExists(focusKey: string): boolean {
  if (!doesFocusableExist(focusKey)) return false
  setFocus(focusKey)
  return true
}
