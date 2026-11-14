import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { ActionButton } from '../components/ActionButton'
import { ContinueRow } from './media/ContinueRow'
import { profileStore } from '../profiles/store'
import { recentChannels } from '../profiles/recent-channels'
import { startPlayback } from './live/playback'
import { navigate } from '../router/router'
import { t } from '../i18n'
export function HomeScreen() {
  const { ref, focusKey } = useFocusable({ focusKey: 'home-content', saveLastFocusedChild: true, trackChildren: true })
  const recent = recentChannels(profileStore.liveProfileId.value ?? '')
  return <FocusContext.Provider value={focusKey}><div ref={ref} style={{ height: '100%', overflowY: 'auto', padding: '40px 48px' }}>
    <h1 style={{ fontSize: 40, marginBottom: 32 }}>{t('nav.home')}</h1>
    <div className="catalogue-toolbar"><ActionButton onPress={() => navigate('/direct', { replace: true })}>{t('nav.direct')}</ActionButton><ActionButton onPress={() => navigate('/favoris', { replace: true })}>{t('nav.favorites')}</ActionButton><ActionButton onPress={() => navigate('/recherche', { replace: true })}>{t('nav.search')}</ActionButton></div>
    <ContinueRow railTarget="nav-/accueil" />
    {recent.length > 0 && <section><h2 style={{ fontSize: 26, marginBottom: 20 }}>{t('home.recent')}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>{recent.map(item => <ActionButton key={item.channel.id} onPress={() => startPlayback(item.channel, item.categoryId)}>{item.channel.name}</ActionButton>)}</div></section>}
  </div></FocusContext.Provider>
}
