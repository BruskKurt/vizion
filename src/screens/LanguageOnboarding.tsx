import { useEffect } from 'preact/hooks'
import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { LANGUAGE_OPTIONS, t } from '../i18n'
import { settingsStore } from '../profiles/settings'
import type { AppLanguage } from '../i18n/languages'

const LANGUAGE_ROOT = 'language-onboarding'

function languageFocusKey(language: AppLanguage): string {
  return `language-${language}`
}

function LanguageCard({ language, nativeName }: { language: AppLanguage; nativeName: string }) {
  const { ref, focused } = useFocusable({
    focusKey: languageFocusKey(language),
    onEnterPress: () => settingsStore.setLanguage(language),
  })

  useEffect(() => {
    if (focused) (ref.current as HTMLElement | null)?.focus()
  }, [focused])

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={-1}
      onClick={() => settingsStore.setLanguage(language)}
      style={{
        minHeight: 102,
        padding: '22px 24px',
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 22,
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        border: '1px solid var(--hairline)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 880 }}>{nativeName}</div>
        <div style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 18, fontWeight: 700 }}>
          {t('language.optionMeta')}
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          minHeight: 36,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--hairline)',
          background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          color: focused ? 'var(--text)' : 'var(--text-dim)',
          fontSize: 15,
          fontWeight: 850,
          whiteSpace: 'nowrap',
        }}
      >
        {t('language.select')}
      </span>
    </div>
  )
}

export function LanguageOnboarding() {
  const { ref, focusKey } = useFocusable({
    focusKey: LANGUAGE_ROOT,
    isFocusBoundary: true,
    preferredChildFocusKey: languageFocusKey(settingsStore.language.value),
    saveLastFocusedChild: true,
    trackChildren: true,
  })

  useEffect(() => {
    const id = setTimeout(() => setFocus(languageFocusKey(settingsStore.language.value)), 0)
    return () => clearTimeout(id)
  }, [])

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '410px minmax(0, 1fr)',
          background: 'var(--bg)',
        }}
      >
        <aside
          className="divider-end"
          style={{
            height: '100%',
            padding: '56px 44px',
            background: 'var(--bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: 0, marginBottom: 30 }}>VIZION</div>
            <div className="section-label">{t('language.onboardingLabel')}</div>
            <div style={{ fontSize: 34, lineHeight: 1.12, fontWeight: 850, marginTop: 12 }}>
              {t('language.onboardingTitle')}
            </div>
          </div>

          <div style={{ marginTop: 'auto', color: 'var(--text-dim)' }}>
            <div style={{ width: 42, height: 3, borderRadius: 2, background: 'var(--accent)', marginBottom: 18 }} />
            <div style={{ fontSize: 18, lineHeight: 1.45, maxWidth: 250 }}>
              Français / English / Español
            </div>
          </div>
        </aside>

        <main
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '64px 76px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <section style={{ width: 'min(780px, 100%)' }}>
            <div style={{ marginBottom: 30 }}>
              <div className="section-label">Vizion</div>
              <h1 style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 900, marginTop: 10 }}>
                {t('language.onboardingTitle')}
              </h1>
              <p style={{ marginTop: 18, color: 'var(--text-dim)', fontSize: 23, lineHeight: 1.45 }}>
                {t('language.onboardingSubtitle')}
              </p>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {LANGUAGE_OPTIONS.map((option) => (
                <LanguageCard key={option.code} language={option.code} nativeName={option.nativeName} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </FocusContext.Provider>
  )
}
