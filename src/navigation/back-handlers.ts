import { useEffect } from 'preact/hooks'

type BackHandler = () => boolean

const handlers: BackHandler[] = []

export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler)
  return () => {
    const index = handlers.indexOf(handler)
    if (index >= 0) handlers.splice(index, 1)
  }
}

export function dispatchBackHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i -= 1) {
    if (handlers[i]()) return true
  }
  return false
}

export function useBackHandler(handler: BackHandler, enabled = true): void {
  useEffect(() => {
    if (!enabled) return undefined
    return registerBackHandler(handler)
  }, [handler, enabled])
}
