import { createSeriesSession } from './series-session'
import { profileStore } from '../profiles/store'
import { providerForProfile } from './provider-factory'

/** Session Séries de l'application, liée au profil VOD choisi. */
export const seriesSession = createSeriesSession(
  () => profileStore.activeVodProfile(),
  providerForProfile,
)
