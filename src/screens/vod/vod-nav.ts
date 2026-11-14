// Navigation VOD : signal de film sélectionné + helper d'ouverture.
// Lot 4 (MovieDetail) lit selectedMovie pour éviter un re-fetch du Movie.
import { signal } from '@preact/signals'
import type { Movie } from '../../data/models'
import { navigate } from '../../router/router'

/** Film sélectionné avant navigation vers la fiche détail. */
export const selectedMovie = signal<Movie | null>(null)

/** Sélectionne un film et navigue vers sa fiche. */
export function openMovie(movie: Movie): void {
  selectedMovie.value = movie
  navigate('/films/m/' + encodeURIComponent(movie.id))
}
