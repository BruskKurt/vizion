import './styles/theme.css'
import './styles/global.css'
import { effect } from '@preact/signals'
import { settingsStore } from './profiles/settings'
import { applyAppearance } from './appearance/themes'
import { render } from 'preact'
import { initSpatialNavigation } from './navigation/spatial'
import { setupTvViewportScale } from './ui/tv-scale'
import { observeNavigationLatency, recordMetric } from './diagnostics/performance'
import { App } from './app'

effect(() => applyAppearance(document.documentElement, settingsStore.theme.value, settingsStore.accent.value))

const startup = performance.now()
observeNavigationLatency()
initSpatialNavigation()
const root = document.getElementById('app')!
setupTvViewportScale(root)
render(<App />, root)
requestAnimationFrame(() => recordMetric('startup', performance.now() - startup))
// Le focus initial est pris en charge par les composants eux-mêmes au montage
// (Sidebar pour le shell, ProfileForm/ProfilesManager pour l'onboarding).
