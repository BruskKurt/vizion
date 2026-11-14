import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { memo } from 'preact/compat'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useFocusable } from '../../navigation/spatial'
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
// dans le DOM quand le focus y passe (sinon navigation bloquée).
const WINDOW = 30

// memo : une ligne ne se re-rend que si son focus ou ses props changent (pas à chaque
// déplacement dans la liste). Les callbacks reçus doivent donc rester stables.
const Row = memo(function Row(props: {
  channel: Channel
  index: number
  selectedCategoryId?: string
  onFocusRow: (index: number, c: Channel) => void
  onPlay: (c: Channel) => void
  onStep: (index: number, delta: number) => boolean
}) {
  const { ref, focused } = useFocusable({
    focusKey: channelFocusKey(props.channel.id),
    onFocus: () => props.onFocusRow(props.index, props.channel),
    onEnterPress: () => props.onPlay(props.channel),
    onArrowPress: (direction) => {
      // Haut/bas par index : évite que Norigin mesure toutes les lignes à chaque appui.
      if (direction === 'up' || direction === 'down') return !props.onStep(props.index, direction === 'down' ? 1 : -1)
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
        // Graisse fixe : la changer au focus refait la mise en page du texte à chaque appui.
        height: ROW_H, borderRadius: 10, fontSize: 21, fontWeight: 600,
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
})

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

  const onFocusRow = useCallback((index: number, c: Channel) => { setCursor({ channels, index }); onFocusChannel(c) }, [channels, onFocusChannel])
  const onStep = useCallback((index: number, delta: number) => {
    const next = channels[index + delta]
    return !!next && focusIfExists(channelFocusKey(next.id))
  }, [channels])

  const start = Math.max(0, center - WINDOW)
  const end = Math.min(channels.length, center + WINDOW + 1)
  const windowed = channels.slice(start, end)

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="divider-end"
        style={{
          width: 'var(--live-channel-width)',
          padding: '28px 14px',
          height: '100%',
          overflowY: 'auto',
          overflowAnchor: 'none',
          // Fond opaque : permet au navigateur de défiler sur une couche GPU sans repeindre la liste.
          background: 'var(--bg)',
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
                onFocusRow={onFocusRow}
                onPlay={onPlay}
                onStep={onStep}
              />
            ))}
            <div style={{ height: Math.max(0, (channels.length - end) * ROW_H) }} />
          </>
        )}
      </div>
    </FocusContext.Provider>
  )
}
