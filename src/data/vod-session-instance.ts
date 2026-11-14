import { createVodSession } from './vod-session'
import { profileStore } from '../profiles/store'
import { providerForProfile } from './provider-factory'

/** Session VOD de l'application, liée au profil Films choisi. */
export const vodSession = createVodSession(
  () => profileStore.activeVodProfile(),
  providerForProfile,
)
