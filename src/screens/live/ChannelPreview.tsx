import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useFocusable } from '../../navigation/spatial'
import type { Channel, EpgEntry } from '../../data/models'
import { currentEntry, nextEntry, progressPct } from '../../components/epg'
import { VideoPlayer } from '../../components/VideoPlayer'
import { focusIfExists } from '../../navigation/focus'
import { channelFocusKey, LIVE_PREVIEW, PREVIEW_FAVORITE, PREVIEW_PLAY } from './focus-keys'
import { t } from '../../i18n'

interface Props {
  channel: Channel | null
  epg: EpgEntry[]
  nowSec: number
  previewSrc: string | null
  onPreviewError?: () => void
  isFavorite: boolean
  onPlay: () => void
  onToggleFavorite: () => void
}

function Btn(props: { focusKey: string; label: string; channelId?: string; onPress: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: props.focusKey,
    onEnterPress: props.onPress,
    onArrowPress: (direction) => {
      if (direction === 'left' && props.channelId && focusIfExists(channelFocusKey(props.channelId))) return false
      // Accès au PIP par flèche bas (si le PIP est actif)
      if (direction === 'down' && focusIfExists('pip-full')) return false
      return true
    },
  })
  return (
    <div
      ref={ref}
      onClick={props.onPress}
      style={{
        padding: '16px 24px', borderRadius: 10, fontSize: 22, fontWeight: 800, marginRight: 14, display: 'inline-block', cursor: 'pointer',
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
      }}
    >
      {props.label}
    </div>
  )
}

export function ChannelPreview({ channel, epg, nowSec, previewSrc, onPreviewError, isFavorite, onPlay, onToggleFavorite }: Props) {
  // useFocusable + le conteneur ref sont TOUJOURS rendus (même sans chaîne) pour que la
  // colonne soit mesurable par la navigation spatiale dès le départ.
  const { ref, focusKey } = useFocusable({
    focusKey: LIVE_PREVIEW,
    // Sans chaîne, aucune action : la colonne ne doit pas capter le focus (D-pad bloqué).
    focusable: channel !== null,
    preferredChildFocusKey: PREVIEW_PLAY,
    saveLastFocusedChild: true,
    trackChildren: true,
  })
  const now = channel ? currentEntry(epg, nowSec) : null
  const next = channel ? nextEntry(epg, nowSec) : null
  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ flex: 1, padding: '32px 40px', minWidth: 0 }}>
        {!channel ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 24 }}>{t('live.selectChannel')}</div>
        ) : (
          <>
            <div style={{ aspectRatio: '16/9', borderRadius: 12, background: '#000', overflow: 'hidden', marginBottom: 26 }}>
              {previewSrc ? (
                <VideoPlayer src={previewSrc} muted onError={onPreviewError} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 26 }}>
                  {channel.logo ? <img src={channel.logo} alt="" style={{ maxWidth: '40%', maxHeight: '40%' }} /> : channel.name}
                </div>
              )}
            </div>
            <h2 style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 850 }}>{channel.name}</h2>
            {now && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 22 }}>{now.title}</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${progressPct(now, nowSec)}%`, background: '#fff', borderRadius: 2 }} />
                </div>
              </div>
            )}
            {next && <div style={{ fontSize: 19, color: 'var(--text-dim)', marginTop: 12 }}>{t('common.next', { title: next.title })}</div>}
            <div style={{ marginTop: 26 }}>
              <Btn focusKey={PREVIEW_PLAY} label={t('common.watch')} channelId={channel.id} onPress={onPlay} />
              <Btn focusKey={PREVIEW_FAVORITE} label={isFavorite ? t('common.remove') : t('common.favorite')} channelId={channel.id} onPress={onToggleFavorite} />
            </div>
          </>
        )}
      </div>
    </FocusContext.Provider>
  )
}
