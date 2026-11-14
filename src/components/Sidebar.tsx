import { useCallback, useEffect, useState } from 'preact/hooks'
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { navigate, route } from '../router/router'
import { focusIfExists } from '../navigation/focus'
import { LIVE_CATEGORIES } from '../screens/live/focus-keys'
import { MOVIE_DETAIL_PLAY, VOD_CONTINUE_ROW, VOD_GRID } from '../screens/vod/vod-focus-keys'
import { SETTINGS_FIRST_ACTION } from '../screens/settings-focus-keys'
import { SEARCH_FIRST_KEY } from '../screens/search/search-focus-keys'
import { APP_VERSION } from '../version'
import { DonateDialog } from './DonateDialog'
import { Icon, type IconName } from './Icons'
import { t, type TranslationKey } from '../i18n'

interface Item { labelKey: TranslationKey; icon: IconName; path: string }

const ITEMS: Item[] = [
  { labelKey: 'nav.home', icon: 'home', path: '/accueil' },
  { labelKey: 'nav.direct', icon: 'tv', path: '/direct' },
  { labelKey: 'nav.films', icon: 'film', path: '/films' },
  { labelKey: 'nav.series', icon: 'series', path: '/series' },
  { labelKey: 'nav.favorites', icon: 'star', path: '/favoris' },
  { labelKey: 'nav.search', icon: 'search', path: '/recherche' },
  { labelKey: 'nav.settings', icon: 'settings', path: '/reglages' },
]

function focusContentForPath(path: string): boolean {
  if (path === '/accueil') return focusIfExists('home-content')
  if (path === '/direct') return focusIfExists(LIVE_CATEGORIES)
  if (path === '/recherche') return focusIfExists(SEARCH_FIRST_KEY)
  if (path === '/favoris') return focusIfExists('favorites-root')
  if (path === '/series') return focusIfExists('series-detail') || focusIfExists('home-series') || focusIfExists(VOD_GRID)
  if (path === '/films') {
    return (
      focusIfExists(MOVIE_DETAIL_PLAY) ||
      focusIfExists(VOD_CONTINUE_ROW) ||
      focusIfExists(VOD_GRID) || focusIfExists('home-films')
    )
  }
  if (path === '/reglages') return focusIfExists(SETTINGS_FIRST_ACTION)
  return false
}

function RailItem({ item, active }: { item: Item; active: boolean }) {
  const { ref, focused } = useFocusable({
    focusKey: `nav-${item.path}`,
    // Sections de premier niveau : remplace (pas d'empilement de l'historique Back).
    onEnterPress: () => navigate(item.path, { replace: true }),
    onArrowPress: (direction) => {
      if (direction === 'right' && active && focusContentForPath(item.path)) {
        return false
      }
      return true
    },
  })
  return (
    <div
      ref={ref}
      onClick={() => navigate(item.path, { replace: true })}
      role="button"
      aria-label={t(item.labelKey)}
      className="rail-item"
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
        minHeight: 64, borderRadius: 12, fontSize: 22, fontWeight: active ? 800 : 650, cursor: 'pointer',
        border: '1px solid transparent',
        color: active ? 'var(--text)' : 'var(--text-dim)',
        background: focused ? 'var(--focus-bg)' : active ? 'var(--active-bg)' : 'transparent',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
      }}
    >
      <span
        style={{
          width: 4,
          height: 34,
          borderRadius: 2,
          background: focused ? 'var(--focus-border)' : active ? 'var(--accent)' : 'transparent',
          flexShrink: 0,
        }}
      />
      <span style={{ width: 34, display: 'flex', justifyContent: 'center', color: active || focused ? 'var(--text)' : 'var(--text-faint)' }}>
        <Icon name={item.icon} size={26} />
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>{t(item.labelKey)}</span>
    </div>
  )
}

function DonateButton({ currentPath, onPress }: { currentPath: string; onPress: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'nav-donate',
    onEnterPress: onPress,
    onArrowPress: (direction) => {
      if (direction === 'right' && focusContentForPath(currentPath)) {
        return false
      }
      return true
    },
  })

  return (
    <button
      ref={ref}
      type="button"
      aria-label={t('nav.donate')}
      onClick={onPress}
      style={{
        width: '100%',
        minHeight: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        border: '1px solid var(--hairline)',
        borderRadius: 10,
        cursor: 'pointer',
        color: 'var(--text)',
        background: focused ? 'var(--focus-bg)' : 'rgba(255,255,255,0.055)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        fontSize: 20,
        fontWeight: 850,
        transition: 'background var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
      }}
    >
      <Icon name="heart" size={22} />
      <span>{t('nav.donate')}</span>
    </button>
  )
}

export function Sidebar() {
  const { ref, focusKey } = useFocusable({ focusKey: 'SIDEBAR', isFocusBoundary: false })
  const [donateOpen, setDonateOpen] = useState(false)
  const current = route.value.segments[0] ?? 'direct'
  const currentPath = `/${current}`
  const closeDonate = useCallback(() => {
    setDonateOpen(false)
    setTimeout(() => setFocus('nav-donate'), 0)
  }, [])
  // Prend le focus au montage : couvre le démarrage ET la transition onboarding → shell
  // (sinon le focus serait perdu quand l'écran de profils se démonte).
  useEffect(() => { setFocus(`nav-${currentPath}`) }, [])
  return (
    <>
      <FocusContext.Provider value={focusKey}>
        <nav
          ref={ref}
          style={{
            width: 'var(--rail-width-expanded)', height: '100%',
            background: 'var(--bg-elevated)',
            borderRight: '1px solid var(--hairline)', padding: '30px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 28, color: 'var(--text)', padding: '4px 20px 28px' }}>VIZION</div>
          {ITEMS.map((it) => (
            <RailItem key={it.path} item={it} active={current === it.path.slice(1)} />
          ))}

          <div
            style={{
              marginTop: 'auto',
              padding: '18px 8px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'stretch',
            }}
          >
            <DonateButton currentPath={currentPath} onPress={() => setDonateOpen(true)} />
            <div style={{ padding: '0 4px', color: 'var(--text-faint)', fontSize: 16, fontWeight: 750 }}>
              {t('nav.version', { version: APP_VERSION })}
            </div>
          </div>
        </nav>
      </FocusContext.Provider>
      {donateOpen && <DonateDialog onClose={closeDonate} />}
    </>
  )
}
