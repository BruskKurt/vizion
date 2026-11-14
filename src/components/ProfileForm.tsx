import { useState, useEffect } from 'preact/hooks'
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import type { Profile } from '../data/models'
import { providerForProfile } from '../data/provider-factory'
import { profileStore } from '../profiles/store'
import { ActionButton } from './ActionButton'
import { navigate } from '../router/router'
import { t } from '../i18n'

type Kind = 'xtream' | 'm3u'

const IPTV_ORG = 'https://iptv-org.github.io/iptv/'
/** Playlists publiques iptv-org proposées à la création pour tester l'app sans abonnement. */
export const FREE_LISTS = [
  { name: 'Global', badge: 'ALL', path: 'index.m3u' },
  { name: 'Français', badge: 'FR', path: 'languages/fra.m3u' },
  { name: 'English', badge: 'EN', path: 'languages/eng.m3u' },
  { name: 'Español', badge: 'ES', path: 'languages/spa.m3u' },
  { name: 'العربية', badge: 'AR', path: 'languages/ara.m3u' },
  { name: 'News', badge: 'NEWS', path: 'categories/news.m3u' },
].map(l => ({ name: `IPTV-ORG ${l.name}`, badge: l.badge, m3uUrl: IPTV_ORG + l.path }))

interface Props {
  /** Profil à éditer ; absent = création. */
  editing?: Profile
  onDone: () => void
}

function Field(props: {
  label: string
  placeholder: string
  value: string
  type?: string
  onInput: (v: string) => void
}) {
  const { ref, focused } = useFocusable()
  // Le focus natif de l'<input> suit le focus spatial : la saisie et le clavier webOS
  // ciblent toujours le bon champ, et la navigation haut/bas reste fiable.
  useEffect(() => {
    if (focused) (ref.current as HTMLInputElement | null)?.focus()
  }, [focused])

  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span
        style={{
          display: 'block',
          color: focused ? 'var(--text)' : 'var(--text-dim)',
          fontSize: 17,
          fontWeight: 750,
          marginBottom: 9,
        }}
      >
        {props.label}
      </span>
      <input
        ref={ref}
        type={props.type ?? 'text'}
        placeholder={props.placeholder}
        value={props.value}
        onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
        style={{
          width: '100%',
          height: 72,
          padding: '0 22px',
          fontSize: 25,
          borderRadius: 10,
          border: `1px solid ${focused ? 'var(--focus-border)' : 'var(--hairline)'}`,
          background: focused ? 'var(--focus-bg)' : 'var(--bg-elevated)',
          color: 'var(--text)',
          boxShadow: focused ? 'var(--focus-glow)' : 'none',
          outline: 'none',
          transition: 'border-color var(--dur) var(--ease), background var(--dur) var(--ease)',
        }}
      />
    </label>
  )
}

function Btn(props: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }) {
  const { ref, focused } = useFocusable({ onEnterPress: props.onPress })
  // Donne le focus natif au bouton quand il est focalisé : cela retire le focus de
  // l'<input> précédent et ferme le clavier webOS (sinon on reste « coincé » dans le champ).
  useEffect(() => {
    if (focused) (ref.current as HTMLElement | null)?.focus()
  }, [focused])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      onClick={props.onPress}
      style={{
        padding: '17px 30px',
        borderRadius: 10,
        fontSize: 24,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'inline-block',
        border: '1px solid transparent',
        transition: 'background var(--dur) var(--ease), border-color var(--dur) var(--ease)',
        color: 'var(--text)',
        background: focused ? 'var(--focus-bg)' : props.variant === 'primary' ? 'var(--active-bg)' : 'var(--surface)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
      }}
    >
      {props.label}
    </div>
  )
}

function SourceOption(props: {
  active: boolean
  title: string
  meta: string
  badge: string
  onPress: () => void
}) {
  const { ref, focused } = useFocusable({ onEnterPress: props.onPress })
  useEffect(() => {
    if (focused) (ref.current as HTMLElement | null)?.focus()
  }, [focused])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      onClick={props.onPress}
      style={{
        minHeight: 116,
        padding: '20px 22px',
        borderRadius: 12,
        border: `1px solid ${props.active && !focused ? 'var(--accent)' : 'var(--hairline)'}`,
        background: focused ? 'var(--focus-bg)' : props.active ? 'var(--active-bg)' : 'var(--bg-elevated)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '64px 1fr',
        alignItems: 'center',
        gap: 18,
        transition: 'background var(--dur) var(--ease), border-color var(--dur) var(--ease)',
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 10,
          background: props.active ? 'var(--accent-soft)' : 'var(--surface)',
          border: '1px solid var(--hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 900,
          color: props.active ? 'var(--accent)' : 'var(--text-dim)',
        }}
      >
        {props.badge}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 850, marginBottom: 5 }}>{props.title}</div>
        <div style={{ fontSize: 17, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {props.meta}
        </div>
      </div>
    </div>
  )
}

export function ProfileForm({ editing, onDone }: Props) {
  // isFocusBoundary : piège le focus dans le formulaire tant qu'il est affiché.
  const { ref, focusKey } = useFocusable({ isFocusBoundary: true })
  // Focus initial sur le premier champ au montage (sinon télécommande morte à l'onboarding).
  useEffect(() => { setFocus(focusKey) }, [focusKey])
  const [kind, setKind] = useState<Kind>(editing?.kind ?? 'xtream')
  const [name, setName] = useState(editing?.name ?? '')
  const [host, setHost] = useState(editing?.host ?? '')
  const [username, setUsername] = useState(editing?.username ?? '')
  const [password, setPassword] = useState(editing?.password ?? '')
  const [m3uUrl, setM3uUrl] = useState(editing?.m3uUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const title = editing ? t('profileForm.editTitle') : t('profileForm.addTitle')

  async function submit(preset?: Omit<Profile, 'id' | 'createdAt'>) {
    if (busy) return
    setError(null)
    const data: Omit<Profile, 'id' | 'createdAt'> =
      preset ?? (kind === 'xtream'
        ? { name: name || t('profileForm.defaultName'), kind, host, username, password }
        : { name: name || t('profileForm.defaultName'), kind, m3uUrl })
    setBusy(true)
    try {
      const candidate: Profile = { ...data, id: 'candidate', createdAt: 0 }
      await providerForProfile(candidate).authenticate()
      if (editing) {
        profileStore.updateProfile(editing.id, data)
      } else {
        // Le 1er profil devient automatiquement source Direct + Films (géré par addProfile).
        profileStore.addProfile(data)
      }
      onDone()
    } catch (e) {
      setError(t('profileForm.connectionError', { message: (e as Error).message }))
    } finally {
      setBusy(false)
    }
  }

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
            <div className="section-label">{t('profileForm.config')}</div>
            <div style={{ fontSize: 34, lineHeight: 1.12, fontWeight: 850, marginTop: 12 }}>
              {kind === 'xtream' ? t('profileForm.xtreamSource') : t('profileForm.m3uPlaylist')}
            </div>
          </div>

          <div style={{ marginTop: 'auto', color: 'var(--text-dim)' }}>
            <div style={{ width: 42, height: 3, borderRadius: 2, background: 'var(--accent)', marginBottom: 18 }} />
            <div style={{ fontSize: 18, lineHeight: 1.45, maxWidth: 220 }}>
              {kind === 'xtream' ? t('profileForm.xtreamMeta') : t('profileForm.m3uMeta')}
            </div>
          </div>
        </aside>

        <main
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '64px 76px',
            display: 'flex',
          }}
        >
          <section style={{ width: 'min(900px, 100%)', margin: 'auto' }}>
            <div style={{ marginBottom: 28 }}>
              <div className="section-label">{t('profileForm.iptvProfile')}</div>
              {!editing && <ActionButton onPress={() => navigate('/configure')}>{t('remote.title')}</ActionButton>}
              <h1 style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 900, marginTop: 10 }}>{title}</h1>
            </div>

            <div
              style={{
                border: '1px solid var(--hairline)',
                borderRadius: 14,
                background: 'var(--panel)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '28px 34px 30px', borderBottom: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: 22, fontWeight: 850, marginBottom: 18 }}>{t('profileForm.sourceType')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <SourceOption
                    active={kind === 'xtream'}
                    title="Xtream"
                    meta={t('profileForm.xtreamFieldsMeta')}
                    badge="XT"
                    onPress={() => setKind('xtream')}
                  />
                  <SourceOption
                    active={kind === 'm3u'}
                    title="M3U"
                    meta={t('profileForm.m3uFieldsMeta')}
                    badge="M3"
                    onPress={() => setKind('m3u')}
                  />
                </div>
              </div>

              <div style={{ padding: '30px 34px 34px' }}>
                <div style={{ fontSize: 22, fontWeight: 850, marginBottom: 18 }}>{t('profileForm.credentials')}</div>
                <Field label={t('profileForm.name')} placeholder={t('profileForm.namePlaceholder')} value={name} onInput={setName} />

                {kind === 'xtream' ? (
                  <>
                    <Field label={t('profileForm.host')} placeholder={t('profileForm.hostPlaceholder')} value={host} onInput={setHost} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                      <Field label={t('profileForm.username')} placeholder={t('profileForm.username')} value={username} onInput={setUsername} />
                      <Field label={t('profileForm.password')} placeholder={t('profileForm.password')} type="password" value={password} onInput={setPassword} />
                    </div>
                  </>
                ) : (
                  <Field label={t('profileForm.playlist')} placeholder={t('profileForm.m3uPlaceholder')} value={m3uUrl} onInput={setM3uUrl} />
                )}

                {error && (
                  <p
                    style={{
                      color: '#ff8a8a',
                      margin: '4px 0 18px',
                      padding: '16px 18px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,138,138,0.35)',
                      background: 'rgba(255,80,80,0.08)',
                      fontSize: 20,
                    }}
                  >
                    {error}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 10 }}>
                  <Btn label={t('common.cancel')} onPress={onDone} />
                  <Btn label={busy ? t('profileForm.connecting') : t('profileForm.save')} variant="primary" onPress={() => submit()} />
                </div>
              </div>
            </div>

            {!editing && (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 850 }}>{t('profileForm.freeLists')}</div>
                <div style={{ fontSize: 17, color: 'var(--text-dim)', margin: '6px 0 16px' }}>{t('profileForm.freeListsMeta')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {FREE_LISTS.map(l => (
                    <SourceOption
                      key={l.m3uUrl}
                      active={false}
                      title={l.name}
                      meta={l.m3uUrl.slice(IPTV_ORG.length)}
                      badge={l.badge}
                      onPress={() => submit({ name: l.name, kind: 'm3u', m3uUrl: l.m3uUrl })}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </FocusContext.Provider>
  )
}
