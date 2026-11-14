// Navigation Séries : signal de série sélectionnée + helper d'ouverture.
// Lot 5 (SeriesDetail) lit selectedSeries pour éviter un re-fetch de la Series.
import { signal } from '@preact/signals'
import type { Series } from '../../data/models'
import { navigate } from '../../router/router'

/** Série sélectionnée avant navigation vers la fiche détail. */
export const selectedSeries = signal<Series | null>(null)

/** Sélectionne une série et navigue vers sa fiche (Lot 3). */
export function openSeries(series: Series): void {
  selectedSeries.value = series
  navigate('/series/s/' + encodeURIComponent(series.id))
}
