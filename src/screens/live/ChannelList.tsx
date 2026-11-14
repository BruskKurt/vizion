import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useEffect, useState } from 'preact/hooks'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { Channel } from '../../data/models'
import { focusIfExists } from '../../navigation/focus'
import { categoryFocusKey, channelFocusKey, LIVE_CHANNELS, PREVIEW_PLAY } from './focus-keys'
import { t } from '../../i18n'

interface Props {
  channels: Channel[]
  restoreChannelId?: string
  loading?: boolean
  selectedCategoryId?: string
  onFocusChannel: (c: Channel) => void
  onPlay: (c: Channel) => void
}

const ROW_H = 72
// Fenêtre rendue autour du focus : large devant pour que la ligne suivante existe déjà
// dans le DOM quand Norigin y déplace le focus (sinon navigation bloquée).
const WINDOW = 30

function Row(props: {
  channel: Channel
  index: number
  selectedCategoryId?: string
  onFocusRow: (index: number, c: Channel) => void
  onPlay: (c: Channel) => void
}) {
  const { ref, focused } = useFocusable({
    focusKey: channelFocusKey(props.channel.id),
    onFocus: () => props.onFocusRow(props.index, props.channel),
    onEnterPress: () => props.onPlay(props.channel),
    onArrowPress: (direction) => {
      if (direction === 'left' && props.selectedCategoryId && focusIfExists(categoryFocusKey(props.selectedCategoryId))) return false
      if (direction === 'right' && focusIfExists(PREVIEW_PLAY)) return false
      return true
    },
  })
  useFocusScroll(ref, focused)
  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={() => props.onPlay(props.channel)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
        height: ROW_H, borderRadius: 10, fontSize: 21, fontWeight: focused ? 800 : 600,
        background: focused ? 'var(--focus-bg)' : 'transparent',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface)', flexShrink: 0, overflow: 'hidden' }}>
        {props.channel.logo && <img loading="lazy" decoding="async" src={props.channel.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
      </div>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.channel.name}</span>
    </div>
  )
}

export function ChannelList({ channels, loading, selectedCategoryId, onFocusChannel, onPlay, restoreChannelId }: Props) {
  const { ref, focusKey } = useFocusable({
    focusKey: LIVE_CHANNELS,
    // Liste vide/en chargement : pas de focus sur un conteneur sans ligne (D-pad bloqué).
    focusable: !loading && channels.length > 0,
    preferredChildFocusKey: channels[0] ? channelFocusKey(channels[0].id) : undefined,
    saveLastFocusedChild: true,
    trackChildren: true,
  })
  // Centre de la fenêtre de rendu = dernière ligne focalisée. Réinitialisé au changement de liste.
  const restoreIndex = Math.max(0, channels.findIndex(c => c.id === restoreChannelId))
  const [cursor, setCursor] = useState({ channels, index: restoreIndex })
  const center = cursor.channels === channels ? cursor.index : restoreIndex
  useEffect(() => {
    if (restoreChannelId && channels.some(c => c.id === restoreChannelId)) {
      const timer = setTimeout(() => focusIfExists(channelFocusKey(restoreChannelId)), 0)
      return () => clearTimeout(timer)
    }
  }, [channels, restoreChannelId])

  const start = Math.max(0, center - WINDOW)
  const end = Math.min(channels.length, center + WINDOW + 1)
  const windowed = channels.slice(start, end)

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          width: 'var(--live-channel-width)',
          borderRight: '1px solid var(--hairline)',
          padding: '28px 14px',
          height: '100%',
          overflowY: 'auto',
          overflowAnchor: 'none',
        }}
      >
        {loading && <p style={{ color: 'var(--text-dim)', padding: 16, fontSize: 20 }}>{t('common.loading')}</p>}
        {!loading && channels.length === 0 && <p style={{ color: 'var(--text-dim)', padding: 16, fontSize: 20 }}>{t('live.noChannel')}</p>}
        {!loading && channels.length > 0 && (
          <>
            {/* Espaceurs : préservent la hauteur de défilement totale malgré le fenêtrage. */}
            <div style={{ height: start * ROW_H }} />
            {windowed.map((c, i) => (
              <Row
                key={c.id}
                channel={c}
                index={start + i}
                selectedCategoryId={selectedCategoryId}
                onFocusRow={(idx, ch) => { setCursor({ channels, index: idx }); onFocusChannel(ch) }}
                onPlay={onPlay}
              />
            ))}
            <div style={{ height: Math.max(0, (channels.length - end) * ROW_H) }} />
          </>
        )}
      </div>
    </FocusContext.Provider>
  )
}
