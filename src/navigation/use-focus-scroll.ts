import { useLayoutEffect } from 'preact/hooks'
import type { RefObject } from 'preact'

/** Keep the focused item visible in the same paint as its highlight.
 * Recheck after each commit: virtual lists can move an existing item when their
 * render window changes. Never queue a delayed or animated scroll behind keys.
 */
export function useFocusScroll(ref: RefObject<HTMLElement>, focused: boolean, inline: ScrollLogicalPosition = 'nearest') {
  useLayoutEffect(() => {
    if (focused) ref.current?.scrollIntoView?.({ block: 'nearest', inline, behavior: 'auto' })
  })
}
