import './settings.css'
import { THEMES, ACCENTS, themeColors, accentColors } from '../appearance/themes'
import { Card, Section, Pill } from './SettingsControls'
import { PlaylistSettings } from './PlaylistSettings'
import { useCallback, useState, useEffect } from 'preact/hooks'
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { profileStore } from '../profiles/store'
import { settingsStore } from '../profiles/settings'
import { PerformancePanel } from '../diagnostics/PerformancePanel'
import { ProfileForm } from '../components/ProfileForm'
import type { Profile } from '../data/models'
import { useBackHandler } from '../navigation/back-handlers'
import { focusIfExists } from '../navigation/focus'
import { SETTINGS_FIRST_ACTION } from './settings-focus-keys'
import { LANGUAGE_OPTIONS, t } from '../i18n'

const SETTINGS_ROOT = 'settings-root'

export function ProfilesManager({ embedded = false }: { embedded?: boolean }) {
  // isFocusBoundary : piège le focus dans l'écran de gestion des profils.
  const { ref, focusKey } = useFocusable({
    focusKey: SETTINGS_ROOT,
    isFocusBoundary: !embedded,
    saveLastFocusedChild: true,
    trackChildren: true,
  })
  const [mode, setMode] = useState<'list' | 'add' | { edit: Profile }>('list')
  const profiles = profileStore.profiles.value
  const [section, setSection] = useState<'playlists' | 'playback' | 'themes' | 'language' | 'diagnostics'>('playlists')
  const [saveError, setSaveError] = useState(false)
  function safely(action: () => void) {
    try { action(); setSaveError(false) } catch { setSaveError(true) }
  }

  // Le formulaire gère lui-même son focus ; on ne place le focus sur la liste
  // que lorsqu'on l'affiche (évite une télécommande morte).
  const showingForm = profiles.length === 0 || mode === 'add' || typeof mode === 'object'
  const handleBack = useCallback(() => {
    if (showingForm && profiles.length > 0) {
      setMode('list')
      return true
    }
    return false
  }, [profiles.length, showingForm])
  useBackHandler(handleBack)

  useEffect(() => {
    if (showingForm) return
    const t = setTimeout(() => {
      if (!focusIfExists(SETTINGS_FIRST_ACTION)) setFocus(focusKey)
    }, 80)
    return () => clearTimeout(t)
  }, [showingForm, focusKey, profiles.length])

  if (showingForm) {
    const editing = typeof mode === 'object' ? mode.edit : undefined
    return (
      <ProfileForm
        editing={editing}
        onDone={() => {
          // Retour à la liste. Au 1er profil, le gate de App bascule seul vers le shell.
          setMode('list')
        }}
      />
    )
  }

  const leaveToRail = embedded
    ? (direction: string) => {
        if (direction === 'left') return !focusIfExists('nav-/reglages')
        return true
      }
    : undefined


  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="settings-page"
        style={{
          height: '100%',
          overflowY: 'auto',

          boxSizing: 'border-box',
        }}
      >
        <div className="settings-inner">
          {saveError && <p role="alert">{t('common.saveError')}</p>}
          <header className="settings-header">
            <div className="section-label" style={{ marginBottom: 10 }}>{t('nav.settings')}</div>
            <h1 style={{ fontSize: 48, lineHeight: 1.05, fontWeight: 880 }}>
              {t('settings.title')}
            </h1>
            <p className="settings-intro">{t('settings.intro')}</p>
          </header>
          <nav className="settings-tabs" aria-label={t('settings.title')}>
            {([
              ['playlists', 'settings.playlists'], ['playback', 'settings.playback'],
              ['themes', 'theme.title'], ['language', 'settings.language'], ['diagnostics', 'perf.title'],
            ] as const).map(([id, label], index) => <Card key={id}
              focusKey={index === 0 ? SETTINGS_FIRST_ACTION : `settings-tab-${id}`}
              label={t(label)} compact selected={section === id}
              onPress={() => setSection(id)} onArrowPress={index === 0 ? leaveToRail : undefined} />)}
          </nav>

          <div className="settings-content" key={section}>
            {section === 'playlists' && <PlaylistSettings onAdd={() => setMode('add')} onEdit={profile => setMode({ edit: profile })} />}

            {section === 'playback' && <Section title={t('settings.playback')}>
                <Card
                  focusKey="settings-resume-last-channel"
                  label={t('settings.resumeLastChannel')}
                  sub={t('settings.startup')}
                  right={<Pill active={settingsStore.resumeLastChannel.value}>{settingsStore.resumeLastChannel.value ? t('common.enabled') : t('common.disabled')}</Pill>}
                  onPress={() => settingsStore.setResumeLastChannel(!settingsStore.resumeLastChannel.value)}

                />
              </Section>}

              {section === 'diagnostics' && <PerformancePanel />}
              {section === 'themes' && <>
                <p className="theme-note">{t('theme.hint')}</p>
                <p className="settings-intro">{t('theme.saved')}</p>
                <Section title={t('theme.complete')}>
                  <div className="theme-grid">{THEMES.map(id => <Card key={id}
                    focusKey={`settings-theme-${id}`} label={t(`theme.${id}`)}
                    selected={settingsStore.theme.value === id}
                    sub={settingsStore.theme.value === id ? t('theme.selected') : id === 'oled' ? t('theme.recommended') : undefined}
                    right={<span className="theme-preview" style={{ background: themeColors[id].bg }} aria-hidden="true"><span style={{ background: themeColors[id].surface }} /><i style={{ background: accentColors[settingsStore.accent.value] }} /></span>}
                    onPress={() => safely(() => settingsStore.setAppearance(id, settingsStore.accent.value))} />)}</div>
                </Section>
                <Section title={t('theme.accent')}>
                  <div className="theme-grid">{ACCENTS.map(id => <Card key={id}
                    focusKey={`settings-accent-${id}`} label={t(`theme.${id}`)}
                    selected={settingsStore.accent.value === id}
                    sub={settingsStore.accent.value === id ? t('theme.selected') : undefined}
                    right={<span className="accent-swatch" style={{ background: accentColors[id] }} aria-hidden="true" />}
                    onPress={() => safely(() => settingsStore.setAppearance(settingsStore.theme.value, id))} />)}</div>
                </Section>
                <Card focusKey="settings-theme-reset" label={t('theme.reset')} onPress={() => safely(() => settingsStore.setAppearance('oled', 'ice'))} />
              </>}
              {section === 'language' && <Section title={t('settings.language')} meta={t('language.optionMeta')}>
                {LANGUAGE_OPTIONS.map((option) => {
                  const active = settingsStore.language.value === option.code
                  return (
                    <Card
                      key={option.code}
                      focusKey={`settings-language-${option.code}`}
                      label={option.nativeName}
                      sub={t(`language.${option.code}`)}
                      right={<Pill active={active}>{active ? t('language.current') : t('language.select')}</Pill>}
                      onPress={() => settingsStore.setLanguage(option.code)}

                    />
                  )
                })}
              </Section>}
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}
