import { signal } from '@preact/signals'
import { getCurrentFocusKey } from '@noriginmedia/norigin-spatial-navigation'
import { parseHash, type ParsedRoute } from './parse'

// Route courante exposée comme signal : lire `route.value` dans un composant
// Preact l'abonne automatiquement aux changements de route.
export const route = signal<ParsedRoute>(parseHash(window.location.hash))
// Pile applicative : chaque entrée garde le focus qu'elle avait quand on l'a quittée,
// pour le redonner au retour (Back).
const stack: { path: string; focus?: string }[] = [{ path: route.value.path }]
const top = () => stack[stack.length - 1]
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
  if (!applyingStackNavigation && top().path !== next.path) {
    stack.push({ path: next.path })
  }
}

window.addEventListener('hashchange', sync)

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const clean = normalize(path)
  if (options.replace) {
    if (stack.length > 1 && stack[stack.length - 2].path === clean) stack.pop()
    else stack[stack.length - 1] = { path: clean }
  } else if (top().path !== clean) {
    top().focus = getCurrentFocusKey() || undefined
    stack.push({ path: clean })
  }
  applyRoute(clean)
}

export function back(): boolean {
  if (stack.length <= 1) return false
  stack.pop()
  applyRoute(top().path)
  return true
}

export function canGoBack(): boolean {
  return stack.length > 1
}

/** Focus qu'avait la page courante quand on l'a quittée (undefined si aucun). */
export function rememberedFocus(): string | undefined {
  return top().focus
}

/** Changement de section (rail) : repart d'une pile neuve, sans historique d'une autre section. */
export function resetNavigationStack(path: string = route.value.path): void {
  stack.splice(0, stack.length, { path: normalize(path) })
  applyRoute(stack[0].path)
}
