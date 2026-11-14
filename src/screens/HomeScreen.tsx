import { useEffect } from 'preact/hooks'
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { ActionButton } from '../components/ActionButton'
import { ContinueRow } from './media/ContinueRow'
import { profileStore } from '../profiles/store'
import { recentChannels } from '../profiles/recent-channels'
import { startPlayback } from './live/playback'
import { navigate, rememberedFocus } from '../router/router'
import { focusIfExists } from '../navigation/focus'
import { t } from '../i18n'
export function HomeScreen() {
  const { ref, focusKey } = useFocusable({ focusKey: 'home-content', saveLastFocusedChild: true, trackChildren: true })
  const recent = recentChannels(profileStore.liveProfileId.value ?? '')
  // Retour (lecteur, Favoris…) : refocalise l'élément quitté.
  useEffect(() => { focusIfExists(rememberedFocus()) }, [])
  return <FocusContext.Provider value={focusKey}><div ref={ref} style={{ height: '100%', overflowY: 'auto', padding: '40px 48px' }}>
    <h1 style={{ fontSize: 40, marginBottom: 32 }}>{t('nav.home')}</h1>
    <div className="catalogue-toolbar"><ActionButton focusKey="home-direct" onPress={() => navigate('/direct')}>{t('nav.direct')}</ActionButton><ActionButton focusKey="home-favorites" onPress={() => navigate('/favoris')}>{t('nav.favorites')}</ActionButton><ActionButton focusKey="home-search" onPress={() => navigate('/recherche')}>{t('nav.search')}</ActionButton></div>
    <ContinueRow railTarget="nav-/accueil" />
    {recent.length > 0 && <section><h2 style={{ fontSize: 26, marginBottom: 20 }}>{t('home.recent')}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>{recent.map(item => <ActionButton key={item.channel.id} focusKey={`home-recent-${item.channel.id}`} onPress={() => startPlayback(item.channel, item.categoryId)}>{item.channel.name}</ActionButton>)}</div></section>}
  </div></FocusContext.Provider>
}
