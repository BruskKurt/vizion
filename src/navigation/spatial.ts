import { effect } from '@preact/signals'
import { init, updateRtl, useFocusable as useNoriginFocusable, type UseFocusableConfig } from '@noriginmedia/norigin-spatial-navigation'
import { currentLanguage, isRtl } from '../i18n'

// Initialise Norigin : gère flèches + OK, sans throttle pour la réactivité TV.
export function initSpatialNavigation(): void {
  init({
    debug: false,
    visualDebug: false,
    throttle: 0,
  })
  // Après init (qui remet Norigin en LTR) : document en miroir pour l'arabe.
  effect(() => {
    const rtl = isRtl()
    document.documentElement.lang = currentLanguage()
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    updateRtl(rtl)
  })
}

const MIRRORED: Record<string, string> = { left: 'right', right: 'left' }

/**
 * useFocusable de Norigin, mais en RTL les gestionnaires onArrowPress reçoivent la direction
 * logique : « left » = vers le début (rail de navigation), quel que soit le sens d'écriture.
 * La navigation géométrique par défaut de Norigin reste, elle, physique.
 */
export function useFocusable<P = object, E = any>(config: UseFocusableConfig<P> = {}) {
  const { onArrowPress } = config
  return useNoriginFocusable<P, E>(onArrowPress
    ? { ...config, onArrowPress: (direction, props, details) => onArrowPress(isRtl() ? MIRRORED[direction] ?? direction : direction, props, details) }
    : config)
}
