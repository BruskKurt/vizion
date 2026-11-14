import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { profileStore } from '../profiles/store'
import type { Profile } from '../data/models'
import { useBackHandler } from '../navigation/back-handlers'
import { focusIfExists } from '../navigation/focus'
import { navigate } from '../router/router'
import { t } from '../i18n'
import { Card, Section, Pill } from './SettingsControls'

type View = { kind: 'list' } | { kind: 'manage'; id: string } | { kind: 'delete'; id: string } | { kind: 'source'; target: 'live' | 'vod' }
const playlistKey = (id: string) => `playlist-manage-${encodeURIComponent(id)}`

export function PlaylistSettings({ onAdd, onEdit }: { onAdd: () => void; onEdit: (profile: Profile) => void }) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const [error, setError] = useState(false)
  const returnFocus = useRef('playlist-add')
  const mounted = useRef(false)
  const profiles = profileStore.profiles.value
  const profile = 'id' in view ? profiles.find(p => p.id === view.id) : undefined
  const goBack = useCallback(() => {
    if (view.kind === 'list') return false
    setError(false)
    setView(view.kind === 'delete' ? { kind: 'manage', id: view.id } : { kind: 'list' })
    return true
  }, [view])
  useBackHandler(goBack)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const timer = setTimeout(() => focusIfExists(view.kind === 'list' ? returnFocus.current : 'playlist-back'), 0)
    return () => clearTimeout(timer)
  }, [view])
  function open(next: View, focus: string) { returnFocus.current = focus; setError(false); setView(next) }
  function save(action: () => void) {
    try { action(); setError(false); setView({ kind: 'list' }) } catch { setError(true) }
  }
  function usage(p: Profile) {
    const live = profileStore.liveProfileId.value === p.id
    const vod = profileStore.vodProfileId.value === p.id
    return live && vod ? t('playlist.allContent') : live ? t('nav.direct') : vod ? t('settings.filmsSeries') : t('playlist.unused')
  }
  const sourceId = view.kind === 'source' && view.target === 'live' ? profileStore.liveProfileId.value : profileStore.vodProfileId.value
  return <div className="playlist-settings">
    {error && <p role="alert">{t('common.saveError')}</p>}
    {view.kind !== 'list' && <div className="playlist-back"><Card compact focusKey="playlist-back" label={`← ${t('playlist.back')}`} onPress={goBack} /></div>}
    {view.kind === 'list' && <>
      <div className="playlist-toolbar">
        <Card compact focusKey="playlist-add" label={`＋ ${t('playlist.add')}`} onPress={onAdd} />
        <Card compact focusKey="playlist-remote" label={t('remote.title')} sub={t('playlist.phone')} onPress={() => navigate('/configure')} />
      </div>
      <Section title={t('playlist.yours')} meta={String(profiles.length)}>
        <div className="playlist-list">{profiles.map(p => <Card key={p.id} focusKey={playlistKey(p.id)} label={p.name}
          sub={`${p.kind === 'xtream' ? 'Xtream' : 'M3U'} · ${usage(p)}`}
          right={<Pill>{t('playlist.manage')} →</Pill>}
          onPress={() => open({ kind: 'manage', id: p.id }, playlistKey(p.id))} />)}</div>
      </Section>
      <Section title={t('settings.sources')}>
        <p className="playlist-hint">{t('playlist.sourcesHint')}</p>
        <div className="playlist-sources">
          <Card compact focusKey="playlist-source-live" label={t('nav.direct')} sub={profileStore.activeLiveProfile()?.name ?? '—'} right={<span aria-hidden="true">›</span>}
            onPress={() => open({ kind: 'source', target: 'live' }, 'playlist-source-live')} />
          <Card compact focusKey="playlist-source-vod" label={t('settings.filmsSeries')} sub={profileStore.activeVodProfile()?.name ?? '—'} right={<span aria-hidden="true">›</span>}
            onPress={() => open({ kind: 'source', target: 'vod' }, 'playlist-source-vod')} />
        </div>
      </Section>
    </>}
    {view.kind === 'manage' && profile && <Section title={profile.name} meta={profile.kind === 'xtream' ? 'Xtream' : 'M3U'}>
      <p className="playlist-hint">{t('playlist.usedFor', { usage: usage(profile) })}</p>
      <Card focusKey="playlist-edit" label={t('playlist.edit')} onPress={() => onEdit(profile)} />
      <Card focusKey="playlist-delete" label={t('playlist.delete')} danger onPress={() => setView({ kind: 'delete', id: profile.id })} />
    </Section>}
    {view.kind === 'delete' && profile && <Section title={t('playlist.deleteTitle', { name: profile.name })}>
      <p className="playlist-hint">{t('playlist.deleteHint')}</p>
      <Card focusKey="playlist-cancel" label={t('common.cancel')} onPress={goBack} />
      <Card focusKey="playlist-confirm-delete" label={t('playlist.delete')} danger onPress={() => save(() => { profileStore.removeProfile(profile.id); returnFocus.current = 'playlist-add' })} />
    </Section>}
    {view.kind === 'source' && <Section title={t(view.target === 'live' ? 'playlist.chooseLive' : 'playlist.chooseVod')}>
      {profiles.map(p => <Card key={p.id} focusKey={`playlist-select-${encodeURIComponent(p.id)}`} label={p.name}
        selected={sourceId === p.id} right={sourceId === p.id ? <Pill active>{t('theme.selected')}</Pill> : undefined}
        onPress={() => save(() => view.target === 'live' ? profileStore.setLiveProfile(p.id) : profileStore.setVodProfile(p.id))} />)}
    </Section>}
  </div>
}
