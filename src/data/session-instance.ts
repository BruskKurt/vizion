import { createLiveSession } from './session'
import { profileStore } from '../profiles/store'
import { providerForProfile } from './provider-factory'

/** Session live de l'application, liée au profil Direct choisi. */
export const liveSession = createLiveSession(
  () => profileStore.activeLiveProfile(),
  providerForProfile,
)
