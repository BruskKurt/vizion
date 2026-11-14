import { SpatialNavigation, setFocus } from '@noriginmedia/norigin-spatial-navigation'

/** Focalise `focusKey` s'il est monté ET focalisable (une rangée vide masquée ne doit
 *  jamais capter le focus : le D-pad y resterait bloqué). */
export function focusIfExists(focusKey: string | null | undefined): boolean {
  if (!focusKey || !SpatialNavigation.isParticipatingFocusableComponent(focusKey)) return false
  setFocus(focusKey)
  return true
}
