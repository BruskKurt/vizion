import { signal } from '@preact/signals'
import { parseHash, type ParsedRoute } from './parse'

// Route courante exposée comme signal : lire `route.value` dans un composant
// Preact l'abonne automatiquement aux changements de route.
export const route = signal<ParsedRoute>(parseHash(window.location.hash))
const stack: string[] = [route.value.path]
let applyingStackNavigation = false

function normalize(path: string): string {
  const clean = path.startsWith('/') ? path : '/' + path
  return parseHash('#' + clean).path
}

function applyRoute(path: string): void {
  const clean = normalize(path)
  const hash = '#' + clean
  applyingStackNavigation = true
  if (window.location.hash !== hash) window.location.hash = clean
  route.value = parseHash(hash)
  applyingStackNavigation = false
}

function sync() {
  const next = parseHash(window.location.hash)
  route.value = next
  if (!applyingStackNavigation && stack[stack.length - 1] !== next.path) {
    stack.push(next.path)
  }
}

window.addEventListener('hashchange', sync)

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const clean = normalize(path)
  if (options.replace) {
    if (stack.length > 1 && stack[stack.length - 2] === clean) stack.pop()
    else stack[stack.length - 1] = clean
  } else if (stack[stack.length - 1] !== clean) {
    stack.push(clean)
  }
  applyRoute(clean)
}

export function back(): boolean {
  if (stack.length <= 1) return false
  stack.pop()
  applyRoute(stack[stack.length - 1])
  return true
}

export function canGoBack(): boolean {
  return stack.length > 1
}

export function resetNavigationStack(path: string = route.value.path): void {
  stack.splice(0, stack.length, normalize(path))
  applyRoute(stack[0])
}
