import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/preact'

afterEach(() => cleanup())

// Node.js 26 expose un `localStorage` natif (value: undefined) sur globalThis,
// ce qui empêche vitest/jsdom de remplacer ce global via populateGlobal
// (la clé est filtrée car déjà présente mais absente de KEYS).
// On récupère les vrais objets Storage depuis l'instance jsdom injectée par vitest
// et on réécrit les descripteurs pour que localStorage/sessionStorage fonctionnent.
if (typeof window !== 'undefined' && 'jsdom' in window) {
  // `window.jsdom` est une propriété interne de vitest (non publique) : si une mise à
  // jour la renomme, le shim devient un no-op et les tests localStorage casseraient avec
  // une erreur obscure. On échoue donc bruyamment ici pour rendre la régression évidente.
  const dom = (window as Record<string, unknown>).jsdom as { window: Window & typeof globalThis } | undefined
  const realLS = dom?.window?.localStorage
  const realSS = dom?.window?.sessionStorage
  if (realLS === undefined) {
    throw new Error('test-setup: shim localStorage cassé (API interne vitest window.jsdom modifiée ?)')
  }
  Object.defineProperty(globalThis, 'localStorage', {
    get: () => realLS,
    configurable: true,
  })
  if (realSS !== undefined) {
    Object.defineProperty(globalThis, 'sessionStorage', {
      get: () => realSS,
      configurable: true,
    })
  }
}
