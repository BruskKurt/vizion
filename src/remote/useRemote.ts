import { useEffect } from 'preact/hooks'
import { mapKeyCode, type RemoteAction } from './keys'

type Handler = (action: RemoteAction) => void

/**
 * Écoute les keydown au niveau document et transmet les actions télécommande
 * NON gérées par la navigation spatiale (Back, média, chiffres).
 * Les flèches et OK sont laissées à Norigin (mapKeyCode renvoie null).
 */
export function useRemote(handler: Handler): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      const target = e.target as HTMLElement | null
      const editable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      // Text editing keeps Backspace and number keys. The real TV Back (461) still navigates.
      if (editable && (e.keyCode === 8 || (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105))) return
      const action = mapKeyCode(e.keyCode)
      if (action) {
        e.preventDefault()
        handler(action)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handler])
}
