import { init } from '@noriginmedia/norigin-spatial-navigation'

// Initialise Norigin : gère flèches + OK, sans throttle pour la réactivité TV.
export function initSpatialNavigation(): void {
  init({
    debug: false,
    visualDebug: false,
    throttle: 0,
  })
}
